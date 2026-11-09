window.AppAPI = (() => {
  function createGenerateLinkStream({ idToken, data, onMessage, onError }) {
    const url =
      "/mi9apk?id_token=" +
      encodeURIComponent(idToken || "") +
      "&data=" +
      encodeURIComponent(data || "");

    const stream = new EventSource(url);
    let closed = false;

    const rawClose = stream.close.bind(stream);

    stream.close = () => {
      if (closed) return;
      closed = true;
      rawClose();
    };

    stream.onmessage = (event) => {
      if (closed) return;

      try {
        const parsed = JSON.parse(event.data);
        if (typeof onMessage === "function") {
          onMessage(parsed, stream);
        }
      } catch (error) {
        console.error("mi9apk parse error:", error, event.data);
      }
    };

    stream.onerror = (error) => {
      if (closed) return;

      if (typeof onError === "function") {
        onError(error, stream);
      }
    };

    return stream;
  }
	function buildCompressUrl(params = {}) {
	  const { h, type, token, ip, googleId, expiration } = params;

	  return (
		"/compress/?" +
		"h=" + encodeURIComponent(h || "") +
		"&p=" + encodeURIComponent(type || "") +
		"&token=" + encodeURIComponent(token || "") +
		"&ip=" + encodeURIComponent(ip || "") +
		"&google_id=" + encodeURIComponent(googleId || "") +
		"&t=" + encodeURIComponent(expiration || "")
	  );
	}
  async function streamZipCompress(params, handlers = {}) {
    const { h, type, token, ip, googleId, expiration, signal } = params || {};
    const { onProgress, onMessage, onHtml, onDone, onError } = handlers;

	const url = buildCompressUrl({
	  h,
	  type,
	  token,
	  ip,
	  googleId,
	  expiration
	});
    let lastPayload = null;

    function emit(parsed) {
      if (!parsed || typeof parsed !== "object") return;

      lastPayload = parsed;

      if (parsed.progress !== undefined && typeof onProgress === "function") {
        onProgress(parsed.progress, parsed);
      }

      const message = parsed.message || parsed.status || "";

      if (message && typeof onMessage === "function") {
        onMessage(message, parsed);
      }

      if (typeof parsed.html === "string" && parsed.html !== "" && typeof onHtml === "function") {
        onHtml(parsed.html, parsed);
      }
    }

    function parseChunk(raw) {
      if (!raw) return null;

      const text = String(raw).trim();
      if (!text) return null;

      if (text.startsWith("data:")) {
        const joined = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n")
          .trim();

        if (!joined) return null;

        try {
          return JSON.parse(joined);
        } catch (error) {
          console.error("compress SSE parse error:", error, joined);
          return null;
        }
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        console.error("compress JSON parse error:", error, text);
        return null;
      }
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "text/event-stream"
        },
        signal
      });

      if (!response.ok) {
        throw new Error("Compress request failed");
      }

      if (!response.body) {
        throw new Error("Streaming not supported by browser");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            const parsed = parseChunk(buffer);
            if (parsed) emit(parsed);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split(/\n\s*\n/);
        buffer = events.pop() || "";

        for (const eventText of events) {
          const parsed = parseChunk(eventText);
          if (parsed) emit(parsed);
        }
      }

      if (typeof onDone === "function") {
        onDone(lastPayload);
      }

      return lastPayload;
    } catch (error) {
      if (typeof onError === "function") {
        onError(error);
      }
      throw error;
    }
  }

return {
  createGenerateLinkStream,
  streamZipCompress,
  buildCompressUrl
};
})();