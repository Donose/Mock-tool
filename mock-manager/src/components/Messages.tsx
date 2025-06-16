import React, { useEffect, useState } from "react";
import "../MockManager.css";

interface Props {
  message: string | null;
  className?: string;
  duration?: number;
}

const Messages: React.FC<Props> = ({ message, duration = 100000 }) => {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  if (!message || !visible) return null;

  return (
    <div
      className="update-message"
      style={{
        position: "relative",
        padding: "1em 3em 1em 1em",
        minWidth: 220,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        margin: "1em 0",
        fontSize: "1em",
        lineHeight: 1.5,
      }}
    >
      {message}
      <button
        onClick={() => setVisible(false)}
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          width: 32,
          height: 32,
          background: "transparent",
          border: "none",
          borderRadius: "50%",
          fontSize: "1.4em",
          cursor: "pointer",
          color: "#888",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s, color 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "#f0f0f0";
          e.currentTarget.style.color = "#c00";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#888";
        }}
        aria-label="Close"
      >
        X
      </button>
    </div>
  );
};

export default Messages;
