FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install git (needed for some Go modules)
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates wget
WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy static files if they exist
COPY --from=builder /app/static ./static 2>/dev/null || true
COPY --from=builder /app/test_data_dir ./test_data_dir 2>/dev/null || true

# Expose port (Render uses PORT environment variable)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Run the binary
CMD ["./main"]