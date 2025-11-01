FROM golang:1.24

WORKDIR /app

COPY backend/go.mod backend/go.sum ./

ENV GOPROXY=https://proxy.golang.org,direct

RUN go mod download

COPY backend ./

COPY backend/fonts ./fonts

RUN go get github.com/jung-kurt/gofpdf && go mod tidy

RUN CGO_ENABLED=0 GOOS=linux go build -o /go-tds-api ./cmd/api/main.go

EXPOSE 8080

CMD ["/go-tds-api"]