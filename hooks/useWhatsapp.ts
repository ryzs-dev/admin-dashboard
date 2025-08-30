import fetcher from "@/lib/fetcher";
import axios from "axios";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// WhatsApp template component
export type TemplateComponent = {
  type: string;
  parameters: { type: string; text?: string }[];
};

export type TemplatePayload = {
  name: string;
  language: { code: string };
  components?: TemplateComponent[]; // <-- added here
};

export type MessageInput = {
  to: string;
  type: "text" | "template";
  message?: string; // used only when type = "text"
  template?: TemplatePayload; // used only when type = "template"
};

// Mutation fetcher
async function sendMessage(url: string, { arg }: { arg: MessageInput }) {
  const { type, ...body } = arg;
  const requestUrl = `${url}?type=${encodeURIComponent(type)}`;

  const response = await axios.post(requestUrl, body);
  return response.data;
}

export function useMessageTemplates() {
  const { data, error, isLoading } = useSWR(
    `${BASE_URL}/api/whatsapp/templates`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  return {
    templates: data?.templates?.data ?? [],
    error,
    loading: isLoading,
  };
}

export function useWhatsapp() {
  const { trigger, data, error, isMutating } = useSWRMutation(
    `${BASE_URL}/api/send`,
    sendMessage
  );

  return {
    sendMessage: trigger,
    data,
    error,
    loading: isMutating,
  };
}
