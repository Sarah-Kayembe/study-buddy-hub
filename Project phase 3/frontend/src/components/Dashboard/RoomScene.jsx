import RoomArt from "./RoomArt";

export default function RoomScene({ mode }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <RoomArt mode={mode === "focus" ? "focus" : "break"} />
    </div>
  );
}
