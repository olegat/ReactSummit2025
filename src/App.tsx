import ZoomPanCanvas from "./components/ZoomPanCanvas";

export default function App() {
  return (
    <div style={{  textAlign: "center", marginTop: "2rem" }}>
      <ZoomPanCanvas width="100%" height="100%" src="https://www.w3schools.com/html/pic_trulli.jpg" />
    </div>
  );
}
