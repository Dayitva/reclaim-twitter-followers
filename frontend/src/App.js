import React, { useState } from "react";
// import QRCode from 'qrcode.react';
import QRious from 'qrious';
import axios from "axios";
import "./App.css";

export default function App() {
  const [url, setURL] = useState("");
  const [qr, setQR] = useState("");

  function generateProof() {
    axios
        .post("https://reclaim-twitter.onrender.com/generateProof")
        .then((res) => {
          setURL(res.data.url);
          console.log(res.data.url);
          const qr = new QRious({
            value: res.data.url,
            size: 300,
            level: 'L'
          }).toDataURL();
          setQR(qr);
        })
        .catch((err) => {
          console.log(err.response);
        });
    }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          {/* <span role="img" aria-label="information">
            👋
          </span>{" "} */}
          Reclaim Protocol
        </div>

        <div className="bio">
          Prove that you have more than 100 followers on Twitter
        </div>

        <button className="speedButton" onClick={() => generateProof()}>
          Prove
        </button>

        {url && 
        <div>
          <div className="bio">
            {qr && <img src={qr} alt="QR code" />}
          </div>

          <div className="bio">
            If you are unable to scan the code, click this url: <a href={url}>Reclaim Proof</a>
          </div>
        </div>
        }
      </div>
    </div>
  );
}
