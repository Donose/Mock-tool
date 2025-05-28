import React, { useEffect, useState } from "react";
import logo from "../assets/logoCerberus.png";
import "../MockManager.css";

export const ServerCheck: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<"online" | "offline" | "checking">("checking");
  const [pulse, setPulse] = useState(false);

  const checkServerStatus = async () => {
    setServerStatus("checking");
    try {
      const res = await fetch("https://localhost:4000/__health");
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
    const interval = setInterval(checkServerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 1000);
    checkServerStatus();
  };

  return (
    <div className="server-status-container">
      <img
        src={logo}
        alt="Server status"
        className={`server-status-logo ${serverStatus} ${pulse ? "pulse" : ""}`}
        onClick={handleLogoClick}
      />
      {serverStatus === "offline" && (
        <div className="server-offline-message">
          <p>
            The mock server is not running.
            <br />
            Start it by running:
          </p>
          <pre className="server-offline-pre">
            npm run dev or npm run mock:https if certs exists
          </pre>
          <p>
            Inside the <code>mock-api-server</code> folder
          </p>
        </div>
      )}
    </div>
  );
};

export default ServerCheck;
