# API Contract

## GET /reports

### Request

```json
{
  "anchor_id": 0,
  "page": "next | prev",
  "page_size": 10,
  "filter": "<empty> | MDP | FDP | SDP"
}
```

- pakai query params.
- `anchor_id` digunakan untuk pagination, kalau `next` jadi > `anchor_id`, sebaliknya juga.
- `page` digunakan sebagai pagination direction.
- `page_size` digunakan untuk jumlah data yang ingin ditampilkan.
- `filter`: untuk filter, kalau tidak pake filter, tidak perlu dikirim

> Untuk page awal, kirim `anchor_id`-nya `0` dan `filter`-nya `""`.

### Response Success

```json
{
    "code": 200,
    "status": "Ok",
    "data": {
        "results": [
            {
                "id": 1,
                "vessel_name": "test",
                "nama": "mr. a",
                "jabatan": "MUALIM 1",
                ...
            },
        ],
        "first_id": 1,
        "last_id": 10,
        "page_size": 10,
        "has_more": true,
        "first_page": true
    }
}
```

### Response Failed

```json
{
  "code": 400,
  "status": "Bad Request",
  "error": "sdasdsd"
}
```

---

## GET /reports/count-by-idp

### Response Success

```json
{
  "code": 200,
  "status": "Ok",
  "data": {
    "FDP": 100,
    "MDP": 200,
    "SDP": 300
  }
}
```

### Response Failed

```json
{
  "code": 500,
  "status": "Internal Server Error",
  "error": "Something went wrong..."
}
```
