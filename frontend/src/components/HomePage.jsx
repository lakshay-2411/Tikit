import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen text-white">
      <Navbar />

      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-40 py-20 md:py-20">
        {/* Left Section */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl font-bold leading-tight">
            Explore <br />
            <span className="text-purple-500">the Exciting</span> <br />
            World of <span className="text-purple-500">NFTs</span>
          </h1>
          <button
            className="px-6 py-3 bg-white text-black rounded-4xl text-lg font-medium cursor-pointer"
            onClick={() => navigate("/events")}
          >
            Explore
          </button>
          <div className="flex space-x-6 text-xl font-semibold mt-6">
            <div className="text-purple-500 text-5xl">
              12k+ <br />
              <span className="text-sm text-white">Artists</span>
            </div>
            <span className="text-gray-500 p-3">|</span>
            <div className="text-purple-500 text-5xl">
              25k+ <br />
              <span className="text-sm text-white">Artworks</span>
            </div>
            <span className="text-gray-500 p-3">|</span>
            <div className="text-purple-500 text-5xl">
              50k+ <br />
              <span className="text-sm text-white">Users</span>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 flex justify-center mt-12 md:mt-0">
          <img
            src="src/assets/bcbvc.svg"
            alt="NFT Artwork"
            className="w-full max-w-md rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
