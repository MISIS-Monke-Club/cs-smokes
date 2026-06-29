FROM golang:1.25.5-alpine AS build

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN go test ./...
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/cs-smokes-bot ./cmd/bot

FROM alpine:3.22

WORKDIR /bot
RUN adduser -D -H -u 10001 bot
COPY --from=build /out/cs-smokes-bot /usr/local/bin/cs-smokes-bot
USER bot

CMD ["/usr/local/bin/cs-smokes-bot"]
