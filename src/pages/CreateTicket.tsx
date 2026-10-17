import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { RBstar, TicketStub } from "@/components/Art";
import { P } from "@/lib/storefront";
import { TopNav, SiteFooter } from "./Home";
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

/* Colours the customer can write with. This set was tuned for a dark editor:
   "White" and a bright #FACC15 Yellow both read on black. The editor is white
   now, so White would erase whatever was typed and four others fell under
   3:1 — every value is re-cut to stay legible on white while keeping its
   label honest. "White" is dropped outright: there is no dark surface left
   in this editor to use it on. */
const COLORS = [
  { value: "#a9b3d3", label: "Gray" },
  { value: "#0a84ff", label: "Blue" },
  { value: "#5fe08e", label: "Green" },
  { value: "#ff5a4d", label: "Red" },
  { value: "#A16207", label: "Yellow" },
  { value: "#7C3AED", label: "Purple" },
  { value: "#C2410C", label: "Orange" },
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
        style={{ color: P.muted }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = P.accentTint;
          e.currentTarget.style.color = P.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = P.muted;
        }}
      >
        {children}
      </button>
    );
  }

  function ToolbarDivider() {
    return <div className="w-px h-5 mx-1" style={{ background: P.borderStrong }} />;
  }

  return (
    <main className="rglow" style={{ minHeight: "100vh" }}>
      <TopNav onHome={() => navigate("/")} />
      <style>{`
        .ticket-field::placeholder { color: ${P.faint}; }
        /* Same blue focus ring the inputs use — the wrapper carries its border
           inline, so the ring is what lights up while the message has focus. */
        .ticket-editor { transition: box-shadow .2s ease; }
        .ticket-editor:focus-within { box-shadow: 0 0 0 4px rgba(47,140,255,0.25); }
        .ticket-editor [contenteditable] {
          outline: none;
          min-height: 340px;
          padding: 18px;
          color: ${P.text};
          font-size: 15px;
          line-height: 1.7;
          background: ${P.card};
        }
        .ticket-editor [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: ${P.faint};
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
          border-left: 3px solid ${P.accent};
          padding-left: 12px;
          margin: 8px 0;
          color: ${P.muted};
        }
        .ticket-editor [contenteditable] pre {
          background: ${P.band};
          border: 1px solid ${P.borderStrong};
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
          border-top: 1px solid ${P.borderStrong};
          margin: 12px 0;
        }
        .ticket-editor [contenteditable] a { color: ${P.accentDeep}; text-decoration: underline; }
        .ticket-editor [contenteditable] img { max-width: 100%; border-radius: 8px; }
      `}</style>

      <div className="max-w-[780px] mx-auto px-4 pt-10 pb-12">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors no-underline"
          style={{ color: P.faint }}
          onMouseEnter={(e) => (e.currentTarget.style.color = P.accentDeep)}
          onMouseLeave={(e) => (e.currentTarget.style.color = P.faint)}
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>

        {/* Designed moment (head): the object this page is about — a support
            ticket stub — then the honest instruction copy. Once, up top. */}
        <div className="flex items-center gap-4 mb-6">
          <TicketStub className="w-16 h-16 flex-shrink-0" />
          <div className="min-w-0">
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1"
              style={{ color: P.text }}
            >
              Create ticket
            </h1>
            <p className="text-sm" style={{ color: P.muted }}>
              Tell us what's going on and we'll help you out
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}
        >
          {error && (
            <div
              className="mx-5 mt-5 rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                background: P.badTint,
                border: `1px solid ${P.bad}`,
                color: P.bad,
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
            className="ticket-field w-full px-3.5 h-11 rounded-xl text-base font-medium outline-none transition-shadow focus:ring-4 focus:ring-[#2f8cff]/25"
            style={{
              margin: "22px 22px 18px",
              background: P.card,
              border: `1px solid ${P.borderStrong}`,
              color: P.text,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = P.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = P.borderStrong)}
          />

          <div
            className="ticket-editor"
            style={{
              margin: "0 22px 22px",
              border: `1px solid ${P.borderStrong}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              className="flex items-center justify-between flex-wrap"
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${P.border}`,
                background: P.band,
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
                        background: P.card,
                        border: `1px solid ${P.borderStrong}`,
                        boxShadow: P.shadow,
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
                            borderColor: P.borderStrong,
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
          <div className="flex flex-col sm:flex-row" style={{ borderTop: `1px solid ${P.border}` }}>
            <div className="sm:flex-[0_0_46%] p-6 pb-0 sm:pb-6 flex flex-col items-start sm:items-end justify-center gap-[52px]">
              <div className="text-left sm:text-right">
                <div style={{ color: P.text, fontSize: 15 }}>Name:</div>
                <div style={{ color: P.muted, fontSize: 14, marginTop: 2 }}>
                  Required
                </div>
              </div>
            </div>
            <div
              className="flex-1 p-6 pt-3 sm:pt-6 sm:pl-0 flex flex-col justify-center border-t sm:border-t-0 sm:border-l"
              style={{ borderColor: P.border }}
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ticket-field w-full px-3.5 h-10 rounded-xl text-sm outline-none transition-shadow focus:ring-4 focus:ring-[#2f8cff]/25"
                style={{
                  background: P.card,
                  border: `1px solid ${P.borderStrong}`,
                  color: P.text,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = P.accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = P.borderStrong)}
              />
            </div>
          </div>

          {/* Email field */}
          <div className="flex flex-col sm:flex-row" style={{ borderTop: `1px solid ${P.border}` }}>
            <div className="sm:flex-[0_0_46%] p-6 pb-0 sm:pb-6 flex flex-col items-start sm:items-end justify-center gap-[52px]">
              <div className="text-left sm:text-right">
                <div style={{ color: P.text, fontSize: 15 }}>Email:</div>
                <div style={{ color: P.muted, fontSize: 14, marginTop: 2 }}>
                  Required
                </div>
              </div>
            </div>
            <div
              className="flex-1 p-6 pt-3 sm:pt-6 sm:pl-0 flex flex-col justify-center border-t sm:border-t-0 sm:border-l"
              style={{ borderColor: P.border }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ticket-field w-full px-3.5 h-10 rounded-xl text-sm outline-none transition-shadow focus:ring-4 focus:ring-[#2f8cff]/25"
                style={{
                  background: P.card,
                  border: `1px solid ${P.borderStrong}`,
                  color: P.text,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = P.accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = P.borderStrong)}
              />
            </div>
          </div>

          {/* Submit */}
          <div
            className="flex justify-center"
            style={{ borderTop: `1px solid ${P.border}`, padding: 20 }}
          >
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black cursor-pointer transition-transform active:translate-y-0.5"
              style={{
                background: P.accentDeep,
                color: "#fff",
                boxShadow: "0 6px 16px rgba(10,110,255,.35)",
                opacity: isPending ? 0.55 : 1,
              }}
            >
              {isPending ? (
                <motion.span
                  className="inline-flex"
                  animate={{ scale: [1, 1.16, 1] }}
                  transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                >
                  <RBstar size={16} color="#fff" />
                </motion.span>
              ) : (
                <Send size={16} />
              )}
              {isPending ? "Creating..." : "Create ticket"}
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
