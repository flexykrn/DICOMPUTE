package ws

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

// Broadcaster manages WebSocket connections and broadcasts events
type Broadcaster struct {
	upgrader    websocket.Upgrader
	clients     map[*Client]bool
	broadcast   chan Event
	register    chan *Client
	unregister  chan *Client
	logger      *zap.Logger
	mu          sync.RWMutex
}

// Client represents a WebSocket client
type Client struct {
	broadcaster *Broadcaster
	conn        *websocket.Conn
	send        chan []byte
}

// Event represents a broadcastable event
type Event struct {
	Type      string      `json:"type"`
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data"`
}

// NewBroadcaster creates a new WebSocket broadcaster
func NewBroadcaster(logger *zap.Logger) *Broadcaster {
	return &Broadcaster{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for hackathon
			},
		},
		clients:    make(map[*Client]bool),
		broadcast:  make(chan Event, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		logger:     logger,
	}
}

// Start begins the broadcaster event loop
func (b *Broadcaster) Start(ctx context.Context) {
	b.logger.Info("starting WebSocket broadcaster")

	for {
		select {
		case <-ctx.Done():
			b.closeAll()
			return
		case client := <-b.register:
			b.mu.Lock()
			b.clients[client] = true
			b.mu.Unlock()
			b.logger.Info("client connected", zap.Int("total", len(b.clients)))

		case client := <-b.unregister:
			b.mu.Lock()
			if _, ok := b.clients[client]; ok {
				delete(b.clients, client)
				close(client.send)
			}
			b.mu.Unlock()
			b.logger.Info("client disconnected", zap.Int("total", len(b.clients)))

		case event := <-b.broadcast:
			b.mu.RLock()
			clients := make(map[*Client]bool)
			for c := range b.clients {
				clients[c] = true
			}
			b.mu.RUnlock()

			message, err := json.Marshal(event)
			if err != nil {
				b.logger.Warn("failed to marshal event", zap.Error(err))
				continue
			}

			for client := range clients {
				select {
				case client.send <- message:
				default:
					// Client buffer full, close it
					b.mu.Lock()
					delete(b.clients, client)
					close(client.send)
					b.mu.Unlock()
				}
			}
		}
	}
}

// Broadcast sends an event to all connected clients
func (b *Broadcaster) Broadcast(eventType string, data interface{}) {
	b.broadcast <- Event{
		Type:      eventType,
		Timestamp: time.Now(),
		Data:      data,
	}
}

// HandleWebSocket handles WebSocket upgrade requests
func (b *Broadcaster) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := b.upgrader.Upgrade(w, r, nil)
	if err != nil {
		b.logger.Warn("websocket upgrade failed", zap.Error(err))
		return
	}

	client := &Client{
		broadcaster: b,
		conn:        conn,
		send:        make(chan []byte, 256),
	}

	b.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.broadcaster.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.broadcaster.logger.Warn("websocket error", zap.Error(err))
			}
			break
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.conn.WriteMessage(websocket.TextMessage, message)

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (b *Broadcaster) closeAll() {
	b.mu.Lock()
	defer b.mu.Unlock()

	for client := range b.clients {
		close(client.send)
		client.conn.Close()
	}
}

// GetClientCount returns number of connected clients
func (b *Broadcaster) GetClientCount() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return len(b.clients)
}

// ServeHTTP implements http.Handler for the broadcaster
func (b *Broadcaster) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	b.HandleWebSocket(w, r)
}
