FROM golang:1.24

WORKDIR /app

COPY backend/go.mod backend/go.sum ./

ENV GOPROXY=https://goproxy.cn,direct

RUN go mod download

COPY backend ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /go-tds-api ./cmd/api/main.go

EXPOSE 8080

CMD [ "/go-tds-api" ]