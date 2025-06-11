import React from "react";
import Messages from "./Messages.tsx";

interface Props {
  onImport: (platform: string) => void;
  importMessage: string | null;
}

const ThirdPartyImport: React.FC<Props> = ({ onImport, importMessage }) => {
  return (
    <form>
      <h3>Third Party Token Mock</h3>
      <div className="mock-form">
        <button type="button" className="button-ps4" onClick={() => onImport("PS4")}>
          PS4
        </button>
        <button type="button" className="button-ps5" onClick={() => onImport("PS5")}>
          PS5
        </button>
        <button type="button" className="button-xbox" onClick={() => onImport("XBX")}>
          XBX
        </button>
        <button type="button" className="button-xbox" onClick={() => onImport("XB1")}>
          XB1
        </button>
        <button type="button" className="button-switch" onClick={() => onImport("Switch")}>
          Switch
        </button>
        <button type="button" className="button-PC" onClick={() => onImport("PC")}>
          PC Xbox Link
        </button>
        <Messages message={importMessage} className="import-message" duration={100000} />
      </div>
    </form>
  );
};

export default ThirdPartyImport;
