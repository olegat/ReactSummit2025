import ZoomPan from "./components/ZoomPan";

export default function App() {
  return (
    <div style={{  textAlign: "center", marginTop: "2rem" }}>
      <ZoomPan width="100%" height="100%" src="./sheep.jpeg" />
    </div>
  );
}
