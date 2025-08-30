"use client";
import { useState, useMemo } from "react";
import { useMessageTemplates, useWhatsapp } from "@/hooks/useWhatsapp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TemplateComponent {
  type: string;
  text?: string;
  example?: { body_text: string[][] };
}

interface Template {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  parameter_format: "POSITIONAL";
  components: TemplateComponent[];
}

export default function Send() {
  const { sendMessage, data, error, loading } = useWhatsapp();
  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
  } = useMessageTemplates();

  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"text" | "template">("text");
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [placeholders, setPlaceholders] = useState<Record<number, string>>({});

  const selectedTemplate: Template | undefined = useMemo(
    () => templates?.find((tpl: Template) => tpl.name === selectedTemplateName),
    [selectedTemplateName, templates]
  );

  // Extract body text and placeholder count
  const templateBody = selectedTemplate?.components.find(
    (c) => c.type === "BODY"
  )?.text;

  const exampleValues =
    selectedTemplate?.components.find((c) => c.type === "BODY")?.example
      ?.body_text?.[0] ?? [];

  const placeholderCount = useMemo(() => {
    if (!templateBody) return 0;
    const matches = templateBody.match(/\{\{(\d+)\}\}/g) || [];
    return matches.length;
  }, [templateBody]);

  const handlePlaceholderChange = (idx: number, value: string) => {
    setPlaceholders((prev) => ({ ...prev, [idx]: value }));
  };

  const previewMessage = useMemo(() => {
    if (!templateBody) return "";
    return templateBody.replace(/\{\{(\d+)\}\}/g, (_, idx) => {
      return placeholders[Number(idx)] || `{{${idx}}}`;
    });
  }, [templateBody, placeholders]);

  const handleSend = async () => {
    try {
      if (type === "template" && selectedTemplate) {
        // Build WhatsApp "components" array

        console.log("Sending template");
        const bodyComponent = {
          type: "body",
          parameters: Array.from({ length: placeholderCount }).map(
            (_, idx) => ({
              type: "text",
              text: placeholders[idx + 1] || "", // user input
            })
          ),
        };

        console.log("Body component:", bodyComponent);

        const payload = {
          to,
          type: "template",
          template: {
            name: `${selectedTemplate.name}`,
            language: { code: `${selectedTemplate.language}` },
            components: [bodyComponent],
          },
        };

        console.log("Payload:", payload);
        await sendMessage({
          to,
          type: "template",
          template: {
            name: `${selectedTemplate.name}`,
            language: { code: `${selectedTemplate.language}` },
            components: [bodyComponent],
          },
        });
      } else {
        console.log("Sending Text");

        // Fallback for plain text
        await sendMessage({
          to,
          type: "text",
          message,
        });
      }
    } catch (err) {
      console.error("❌ Failed to send:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Inputs */}
      <div className="p-4 border rounded-xl space-y-4">
        <input
          type="text"
          placeholder="Enter phone number"
          className="w-full p-2 border rounded"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <Select
          value={type}
          onValueChange={(value) => setType(value as "text" | "template")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select message type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="template">Template</SelectItem>
          </SelectContent>
        </Select>

        {type === "text" && (
          <textarea
            placeholder="Enter message"
            className="w-full p-2 border rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        )}

        {type === "template" && (
          <>
            <Select
              value={selectedTemplateName}
              onValueChange={(value) => {
                setSelectedTemplateName(value);
                setPlaceholders({});
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templatesLoading && (
                  <SelectItem value="loading" disabled>
                    Loading templates...
                  </SelectItem>
                )}
                {templatesError && (
                  <SelectItem value="error" disabled>
                    Failed to load templates
                  </SelectItem>
                )}
                {templates &&
                  templates.map((tpl: Template, idx: number) => (
                    <SelectItem key={idx} value={tpl.name}>
                      {tpl.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Placeholder input fields */}
            {placeholderCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fill placeholders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from({ length: placeholderCount }).map((_, idx) => (
                    <Input
                      key={idx}
                      placeholder={`{{${idx + 1}}} (e.g. ${
                        exampleValues[idx] ?? ""
                      })`}
                      value={placeholders[idx + 1] || ""}
                      onChange={(e) =>
                        handlePlaceholderChange(idx + 1, e.target.value)
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <button
          onClick={handleSend}
          disabled={loading || (type === "template" && !selectedTemplateName)}
          className="w-full bg-green-500 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send WhatsApp"}
        </button>

        {data && <p className="text-green-600">✅ Sent successfully!</p>}
        {error && <p className="text-red-600">❌ Failed: {error.message}</p>}
      </div>

      {/* Right: Preview */}
      <div className="p-4 border rounded-xl">
        {type === "template" && selectedTemplate ? (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{previewMessage}</p>
            </CardContent>
          </Card>
        ) : (
          <p className="text-gray-500">Select a template to preview</p>
        )}
      </div>
    </div>
  );
}
