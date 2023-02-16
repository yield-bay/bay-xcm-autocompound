import dynamic from "next/dynamic";
const Home = dynamic(() => import("@components/Home"), {
  ssr: false,
});

export default Home;