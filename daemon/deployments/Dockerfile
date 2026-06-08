# Build stage
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o dicompute-daemon ./cmd/daemon

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates docker-cli

WORKDIR /app

COPY --from=builder /build/dicompute-daemon .

# Create data directory
RUN mkdir -p /var/lib/dicompute/data

ENTRYPOINT ["./dicompute-daemon"]
