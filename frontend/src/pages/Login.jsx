import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import security from "../assets/security.png";
import logo from "../assets/security.png";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {

    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (!response.data.token) {
        alert(response.data.message);
        return;
      }

      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("refreshToken", response.data.refreshToken);
      sessionStorage.setItem("email", response.data.email);
      sessionStorage.setItem(
        "role",
        response.data.role === "USER" ? "VIEWER" : response.data.role
      );
      sessionStorage.setItem("isLoggedIn", "true");

      alert(response.data.message);

      navigate("/dashboard");

    } catch (error) {

      console.log(error);

      if (error.response) {
        alert(error.response.data.message || "Login Failed");
      } else {
        alert("Server is not responding");
      }

    }

  };

  return (
    <div className="min-h-screen  flex bg-[#07142B]">

      {/* Left Side */}
      <div className="w-1/2 flex items-center justify-center px-12">

        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">

            <img
              src={logo}
              alt="logo"
              className="w-14 h-14"
            />

            <div>
              <h1 className="text-4xl font-bold text-white">
                Sentinel<span className="text-blue-500">Core</span>
              </h1>

              <p className="tracking-[5px] text-blue-300 text-sm">
                SECURITY OPERATIONS
              </p>
            </div>

          </div>

          {/* Login Card */}

          <div className="bg-[#0D1F3A] border border-blue-900 rounded-3xl p-8 shadow-2xl">

            <h2 className="text-4xl font-bold text-white">
              Welcome Back
            </h2>

            <p className="text-gray-400 mt-2 mb-8">
              Sign in to your account to continue
            </p>

            {/* Email */}

            <label className="text-white font-medium">
              Email Address
            </label>

            <div className="relative mt-2 mb-6">

              <FaEnvelope className="absolute left-4 top-4 text-gray-400" />

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#142845] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500"
              />

            </div>

            {/* Password */}

            <label className="text-white font-medium">
              Password
            </label>

            <div className="relative mt-2">

              <FaLock className="absolute left-4 top-4 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#142845] border border-gray-700 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>

            </div>

            {/* Remember Me */}

            <div className="flex justify-between items-center mt-6">

              <label className="flex items-center gap-2 text-gray-300">

                <input
                  type="checkbox"
                  className="accent-blue-600"
                />

                Remember me

              </label>

              <Link
                to="/forgot-password"
                className="text-blue-400 hover:text-blue-500"
              >
                Forgot Password?
              </Link>

            </div>

            {/* Login Button */}

            <button
              onClick={handleLogin}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 transition duration-300 py-3 rounded-xl text-white font-semibold text-lg"
            >
              Login
            </button>

            {/* Divider */}

            <div className="flex items-center my-8">

              <div className="flex-1 h-px bg-gray-700"></div>

              <span className="px-4 text-gray-500">
                OR
              </span>

              <div className="flex-1 h-px bg-gray-700"></div>

            </div>

            {/* Register */}

            <p className="text-center text-gray-400">

              Don't have an account?

              <Link
                to="/register"
                className="text-blue-400 ml-2 hover:text-blue-500"
              >
                Register
              </Link>

            </p>

          </div>

          <p className="text-center text-gray-500 mt-8">
            Securing Today, Protecting Tomorrow.
          </p>

        </div>

      </div>

      {/* Right Side */}

      <div className="w-1/2 h-full relative overflow-hidden">

        <img
          src={security}
          alt="security"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-[#07142B]/20"></div>

      </div>

    </div>
  );
}

export default Login;
