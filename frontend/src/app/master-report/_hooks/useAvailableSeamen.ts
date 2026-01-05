// hooks/useAvailableSeamen.ts
import { useEffect, useState } from "react"
import { api } from "@/app/lib/api"
import { SeamanLookup } from "@/types/global-types"

export function useAvailableSeamen(search: string) {
  const [data, setData] = useState<SeamanLookup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setData([])
      return
    }

    const controller = new AbortController()

    const fetchSeamen = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get("/api/seamen/available", {
          params: {
            query: search,
            limit: 10,
          },
          signal: controller.signal,
        })

        const rows =
          response.data?.data?.data ||
          response.data?.data ||
          []

        setData(rows)
      } catch (err: any) {
        if (err.name !== "CanceledError") {
          setError("Failed to load seamen")
        }
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(fetchSeamen, 300)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [search])

  return { data, loading, error }
}
