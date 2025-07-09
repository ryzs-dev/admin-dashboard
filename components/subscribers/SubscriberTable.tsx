"use client";

import { Subscriber } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

interface Props {
  subscribers: Subscriber[];
}

// Format timestamp (milliseconds) to date string
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format timestamp (milliseconds) to time string
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export function SubscriberTable({ subscribers }: Props) {
  if (!subscribers || subscribers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="w-8 h-8 text-gray-400 mb-2" />
        <h3 className="text-base font-medium text-gray-900 mb-1">
          No subscribers found
        </h3>
        <p className="text-gray-500 text-sm">
          Get started by adding your first subscriber.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="px-4 py-2 text-gray-700 font-medium text-left">
              PSID
            </TableHead>
            <TableHead className="px-4 py-2 text-gray-700 font-medium text-left">
              Source
            </TableHead>
            <TableHead className="px-4 py-2 text-gray-700 font-medium text-left">
              Created
            </TableHead>
            <TableHead className="px-4 py-2 text-gray-700 font-medium text-center">
              Step
            </TableHead>
            <TableHead className="px-4 py-2 text-gray-700 font-medium text-left">
              Last Sent
            </TableHead>
            <TableHead className="px-4 py-2 text-gray-700 font-medium text-left">
              Next Send
            </TableHead>
            <TableHead className="px-4 py-2 text-gray-700 font-medium text-center">
              Funnel Stage
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((sub) => (
            <TableRow key={sub.psid} className="border-b border-gray-200">
              <TableCell className="px-4 py-3 text-gray-900">
                {sub.psid}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-900 capitalize">
                {sub.source}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-900">
                {formatDate(sub.created_at)}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-900 text-center">
                {sub.sequence_step}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-900">
                {sub.last_sent ? formatTime(sub.last_sent) : "—"}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-900">
                {sub.next_send_time ? formatTime(sub.next_send_time) : "—"}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-900 text-center">
                {sub.funnel_stage || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
