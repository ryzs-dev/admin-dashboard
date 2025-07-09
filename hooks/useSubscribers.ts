/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { FunnelStageStat } from "@/types";
import { useEffect, useState } from "react";

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subscribers`
        );
        const data = await res.json();
        if (data.success) {
          setSubscribers(data.data);
        } else {
          setError("Failed to fetch subscribers");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchSubs();
  }, []);

  return { subscribers, loading, error };
}

export function useFunnelStats() {
  const [data, setData] = useState<FunnelStageStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://bot.lunaawomencare.com/api/subscribers/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error("❌ Failed to fetch funnel stats", err))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
