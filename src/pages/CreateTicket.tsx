import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  ImagePlus,
  Code,
  Quote,
  Minus,
  Palette,
  Undo2,
  Redo2,
  Send,
} from "lucide-react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const COLORS = [
  { value: "#F4F8FB", label: "White" },
  { value: "#9BAEBB", label: "Gray" },
  { value: "#3BA7FF", label: "Blue" },
  { value: "#00B06F", label: "Green" },
  { value: "#EF4444", label: "Red" },
  { value: "#FACC15", label: "Yellow" },
  { value: "#A78BFA", label: "Purple" },
  { value: "#FB923C", label: "Orange" },
];

export default function CreateTicket() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const editorRef = useRef<HTMLDivElement>(null);

  const [subject, setSubject] = useState("");
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const messageHtml = editorRef.current?.innerHTML || "";
      const messageText = editorRef.current?.innerText || "";
      if (!messageText.trim()) throw new Error("Please enter a message");

      const res = await fetch(`${BACKEND}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          category: "general",
          customerEmail: email,
          customerName: name,
          initialMessage: messageHtml || messageText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create ticket");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      navigate("/tickets");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit() {
    setError("");
    if (!subject.trim()) {
      setError("Please enter a title");
      return;
    }
    mutate();
  }

  const execCmd = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }, []);

  function insertLink() {
    const url = prompt("Enter URL:");
    if (url) execCmd("createLink", url);
  }

  function insertImage() {
    const url = prompt("Enter image URL:");
    if (url) execCmd("insertImage", url);
  }

  function ToolbarBtn({
    onClick,
    children,
    title,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) {
    return (
      <button
        type="button"
        title={title}
        onClick={onClick}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
        style={{ color: "#9BAEBB" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(59,167,255,0.15)";
          e.currentTarget.style.color = "#F4F8FB";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#9BAEBB";
        }}
      >
        {children}
      </button>
    );
  }

  function ToolbarDivider() {
    return <div className="w-px h-5 mx-1" style={{ background: "#2C414E" }} />;
  }

  return (
    <main style={{ background: "#131C23", minHeight: "100vh" }}>
      <style>{`
        .ticket-editor [contenteditable] {
          outline: none;
          min-height: 340px;
          padding: 18px;
          color: #F4F8FB;
          font-size: 15px;
          line-height: 1.7;
          background: #0C141B;
        }
        .ticket-editor [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #637784;
          pointer-events: none;
        }
        .ticket-editor [contenteditable] b,
        .ticket-editor [contenteditable] strong { font-weight: 700; }
        .ticket-editor [contenteditable] i,
        .ticket-editor [contenteditable] em { font-style: italic; }
        .ticket-editor [contenteditable] u { text-decoration: underline; }
        .ticket-editor [contenteditable] s,
        .ticket-editor [contenteditable] strike { text-decoration: line-through; }
        .ticket-editor [contenteditable] ul { list-style: disc; padding-left: 24px; }
        .ticket-editor [contenteditable] ol { list-style: decimal; padding-left: 24px; }
        .ticket-editor [contenteditable] blockquote {
          border-left: 3px solid #3BA7FF;
          padding-left: 12px;
          margin: 8px 0;
          color: #9BAEBB;
        }
        .ticket-editor [contenteditable] pre {
          background: #0C141B;
          border: 1px solid #2C414E;
          border-radius: 8px;
          padding: 12px;
          font-family: monospace;
          font-size: 13px;
          overflow-x: auto;
        }
        .ticket-editor [contenteditable] h1 { font-size: 22px; font-weight: 700; margin: 8px 0; }
        .ticket-editor [contenteditable] h2 { font-size: 18px; font-weight: 600; margin: 6px 0; }
        .ticket-editor [contenteditable] hr {
          border: none;
          border-top: 1px solid #2C414E;
          margin: 12px 0;
        }
        .ticket-editor [contenteditable] a { color: #3BA7FF; text-decoration: underline; }
        .ticket-editor [contenteditable] img { max-width: 100%; border-radius: 8px; }
      `}</style>

      <div className="max-w-[780px] mx-auto px-4 pt-28 pb-12">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors no-underline"
          style={{ color: "#637784" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#3BA7FF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#637784")}
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>

        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2"
          style={{ color: "#F4F8FB" }}
        >
          Create ticket
        </h1>
        <p className="text-sm mb-6" style={{ color: "#9BAEBB" }}>
          Tell us what's going on and we'll help you out
        </p>

        <div
          className="card-depth rounded-2xl overflow-hidden"
          style={{ background: "#1C2A34", border: "1px solid #2C414E" }}
        >
          {error && (
            <div
              className="mx-5 mt-5 rounded-lg px-4 py-3 text-sm font-semibold"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid #EF4444",
                color: "#EF4444",
              }}
            >
              {error}
            </div>
          )}

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Title..."
            className="w-full text-[16px] outline-none font-medium"
            style={{
              margin: "22px 22px 18px",
              padding: "14px 16px",
              background: "#0C141B",
              border: "1px solid #2C414E",
              borderRadius: 12,
              color: "#F4F8FB",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#3BA7FF")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2C414E")}
          />

          <div
            className="ticket-editor"
            style={{
              margin: "0 22px 22px",
              border: "1px solid #2C414E",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              className="flex items-center justify-between flex-wrap"
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #2C414E",
                background: "#1C2A34",
              }}
            >
              <div className="flex items-center gap-1 flex-wrap">
                {/* Text formatting */}
                <ToolbarBtn onClick={() => execCmd("bold")} title="Bold">
                  <Bold size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("italic")} title="Italic">
                  <Italic size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("underline")} title="Underline">
                  <Underline size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("strikeThrough")} title="Strikethrough">
                  <Strikethrough size={16} />
                </ToolbarBtn>

                <ToolbarDivider />

                {/* Headings */}
                <ToolbarBtn onClick={() => execCmd("formatBlock", "h1")} title="Heading">
                  <Heading1 size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("formatBlock", "h2")} title="Subheading">
                  <Heading2 size={16} />
                </ToolbarBtn>

                <ToolbarDivider />

                {/* Alignment */}
                <ToolbarBtn onClick={() => execCmd("justifyLeft")} title="Align left">
                  <AlignLeft size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("justifyCenter")} title="Align center">
                  <AlignCenter size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("justifyRight")} title="Align right">
                  <AlignRight size={16} />
                </ToolbarBtn>

                <ToolbarDivider />

                {/* Lists */}
                <ToolbarBtn onClick={() => execCmd("insertUnorderedList")} title="Bullet list">
                  <List size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("insertOrderedList")} title="Numbered list">
                  <ListOrdered size={16} />
                </ToolbarBtn>

                <ToolbarDivider />

                {/* Insert */}
                <ToolbarBtn onClick={insertLink} title="Insert link">
                  <Link2 size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={insertImage} title="Insert image">
                  <ImagePlus size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("formatBlock", "pre")} title="Code block">
                  <Code size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("formatBlock", "blockquote")} title="Quote">
                  <Quote size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("insertHorizontalRule")} title="Horizontal rule">
                  <Minus size={16} />
                </ToolbarBtn>

                <ToolbarDivider />

                {/* Color picker */}
                <div className="relative">
                  <ToolbarBtn
                    onClick={() => setShowColorPicker((p) => !p)}
                    title="Text color"
                  >
                    <Palette size={16} />
                  </ToolbarBtn>
                  {showColorPicker && (
                    <div
                      className="absolute top-full left-0 mt-2 p-3 rounded-xl flex gap-2 flex-wrap z-50"
                      style={{
                        background: "#1C2A34",
                        border: "1px solid #2C414E",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        width: 180,
                      }}
                    >
                      {COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.label}
                          className="w-6 h-6 rounded-full cursor-pointer border-2 transition-transform hover:scale-110"
                          style={{
                            background: c.value,
                            borderColor: "transparent",
                          }}
                          onClick={() => {
                            execCmd("foreColor", c.value);
                            setShowColorPicker(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <ToolbarBtn onClick={() => execCmd("undo")} title="Undo">
                  <Undo2 size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd("redo")} title="Redo">
                  <Redo2 size={16} />
                </ToolbarBtn>
              </div>
            </div>

            <div
              ref={editorRef}
              contentEditable
              data-placeholder="Describe your issue in detail..."
              suppressContentEditableWarning
            />
          </div>

          {/* Name field */}
          <div className="flex" style={{ borderTop: "1px solid #2C414E" }}>
            <div className="flex-[0_0_46%] p-6 flex flex-col items-end justify-center gap-[52px]">
              <div className="text-right">
                <div style={{ color: "#F4F8FB", fontSize: 15 }}>Name:</div>
                <div style={{ color: "#637784", fontSize: 14, marginTop: 2 }}>
                  Required
                </div>
              </div>
            </div>
            <div
              className="flex-1 p-6 pl-0 flex flex-col justify-center"
              style={{ borderLeft: "1px solid #2C414E" }}
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full outline-none"
                style={{
                  background: "#0C141B",
                  border: "1px solid #2C414E",
                  borderRadius: 8,
                  padding: "14px 16px",
                  color: "#F4F8FB",
                  fontSize: 15,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3BA7FF")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2C414E")}
              />
            </div>
          </div>

          {/* Email field */}
          <div className="flex" style={{ borderTop: "1px solid #2C414E" }}>
            <div className="flex-[0_0_46%] p-6 flex flex-col items-end justify-center gap-[52px]">
              <div className="text-right">
                <div style={{ color: "#F4F8FB", fontSize: 15 }}>Email:</div>
                <div style={{ color: "#637784", fontSize: 14, marginTop: 2 }}>
                  Required
                </div>
              </div>
            </div>
            <div
              className="flex-1 p-6 pl-0 flex flex-col justify-center"
              style={{ borderLeft: "1px solid #2C414E" }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full outline-none"
                style={{
                  background: "#0C141B",
                  border: "1px solid #2C414E",
                  borderRadius: 8,
                  padding: "14px 16px",
                  color: "#F4F8FB",
                  fontSize: 15,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3BA7FF")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2C414E")}
              />
            </div>
          </div>

          {/* Submit */}
          <div
            className="flex justify-center"
            style={{ borderTop: "1px solid #2C414E", padding: 20 }}
          >
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="btn-3d"
              style={{
                background: "#3BA7FF",
                color: "#fff",
                opacity: isPending ? 0.55 : 1,
              }}
            >
              {isPending ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent rounded-full" />
              ) : (
                <Send size={16} />
              )}
              {isPending ? "Creating..." : "Create ticket"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
