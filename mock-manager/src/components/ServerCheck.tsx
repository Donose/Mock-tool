import React, { useEffect, useState } from "react";
import "../MockManager.css";

export const ServerCheck: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<"online" | "offline" | "checking">("checking");
  const checkServerStatus = async () => {
    setServerStatus("checking");
    try {
      const res = await fetch("http://localhost:4000/__health");
      if (res.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("offline");
      }
    } catch {
      setServerStatus("offline");
    }
  };
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(() => {
      checkServerStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="server-status-container">
      <button onClick={checkServerStatus} className={`toggle-details-button ${serverStatus}`}>
        {serverStatus === "checking"
          ? "Checking Server..."
          : serverStatus === "online"
          ? "Server Online"
          : "Server Offline "}
      </button>
      {serverStatus === "offline" && (
        <div className="server-offline-message">
          <p>
            The mock server is not running.
            <br />
            Start it by running:
          </p>
          <pre className="server-offline-pre">npm run dev</pre>
          <p>
            Inside the <code>mock-api-server</code> folder
          </p>
        </div>
      )}
    </div>
  );
};

export default ServerCheck;
