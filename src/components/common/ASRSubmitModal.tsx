import { X, UploadCloud, Eye, Network, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { ThemeContext } from "../../theme-context";
import { useContext } from "react";

export function ASRSubmitModal() {
  const isOpen = useAppStore((s) => s.isSubmitModalOpen);
  const setIsOpen = useAppStore((s) => s.setIsSubmitModalOpen);
  const theme = useContext(ThemeContext);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${
            theme === "dark"
              ? "border-white/10 bg-zinc-950 text-white"
              : "border-black/5 bg-white text-zinc-900"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b px-6 py-4 ${
              theme === "dark" ? "border-white/10" : "border-black/5"
            }`}
          >
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide">
              Verify Your Run
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className={`rounded-full p-2 outline-none transition-colors ${
                theme === "dark"
                  ? "hover:bg-white/10 focus-visible:bg-white/10"
                  : "hover:bg-black/5 focus-visible:bg-black/5"
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Follow our community protocol to get your run verified and added to the leaderboards.
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    theme === "dark"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="font-sans font-semibold uppercase tracking-tight">
                    1. BEFORE YOU SUBMIT
                  </h3>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    Make sure your start/stop touches are visible and that you cleared all checkpoints.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    theme === "dark"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  <UploadCloud size={18} />
                </div>
                <div>
                  <h3 className="font-sans font-semibold uppercase tracking-tight">
                    2. UPLOAD VIDEO PROOF
                  </h3>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    Upload your raw, uncut video to the public{" "}
                    <a
                      href="https://drive.google.com/drive/folders/1EPR8ZK09w8PtZ9XrC7N7lW7P8nPJ-anN?usp=sharing"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline focus-visible:underline outline-none"
                    >
                      ASR Google Drive
                    </a>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    theme === "dark"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  <Network size={18} />
                </div>
                <div>
                  <h3 className="font-sans font-semibold uppercase tracking-tight">
                    3. VERIFY IN PUBLIC
                  </h3>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    Share your info and link to the ASR community audit post on{" "}
                    <a
                      href="https://www.skool.com/apexmovement/share-verify-asr-clips-here"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-500 hover:text-blue-400 hover:underline"
                    >
                      Parkour Skool app
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <a
                href="https://www.skool.com/apexmovement/share-verify-asr-clips-here"
                target="_blank"
                rel="noreferrer"
                className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
              >
                <div className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-white px-4 py-3 font-mono text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95">
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  GET VERIFIED
                  <ExternalLink size={16} className="ml-1" />
                </div>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
