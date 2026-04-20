// Dashboard.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  FileText,
  ShieldCheck,
  Upload,
  LogOut,
  Send,
  Trash2,
  Sparkles,
  HeartPulse,
  BarChart3,
  Files,
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const user = JSON.parse(
    localStorage.getItem("userInfo") || "{}"
  );

  // ---------------- STATES ----------------
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState({});
  const [report1, setReport1] = useState("");
  const [report2, setReport2] = useState("");

  // ---------------- FETCH REPORTS ----------------
  const fetchReports = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/reports",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setReports(data || []);
    } catch (error) {
      console.log(error);
    }
  };

  // ---------------- FETCH CHAT HISTORY ----------------
  const fetchChatHistory = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/chat-history",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const formatted = data
        .map((item) => [
          {
            sender: "user",
            text: item.question,
          },
          {
            sender: "bot",
            text: item.answer,
          },
        ])
        .flat();

      setMessages(formatted);
    } catch (error) {
      console.log(error);
    }
  };

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    if (user?.token) {
      fetchReports();
      fetchChatHistory();
    }
  }, []);

  // ---------------- AUTO SCROLL ----------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ---------------- FETCH LABS ----------------
  const fetchLabs = async (text) => {
    try {
      const { data } = await axios.post(
        "http://localhost:8000/extract-labs",
        {
          report_text: text,
          question: "extract",
        }
      );

      const parsed = JSON.parse(data.data);
      setLabs(parsed);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (reports.length > 0) {
      fetchLabs(reports[0].extractedText);
    }
  }, [reports]);

  // ---------------- UPLOAD ----------------
  const uploadHandler = async () => {
    if (!file) return alert("Choose a file");

    const formData = new FormData();
    formData.append("report", file);

    try {
      await axios.post(
        "http://localhost:5000/api/reports",
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      alert("Uploaded Successfully");
      setFile(null);
      fetchReports();
    } catch (error) {
      alert("Upload failed");
    }
  };

  // ---------------- CHAT ----------------
  const askAI = async () => {
    if (!question.trim()) return;

    const currentQuestion = question;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: currentQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/chat",
        {
          question: currentQuestion,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const botReply = data.answer;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botReply,
        },
      ]);

      // SAVE CHAT TO DB
      await axios.post(
        "http://localhost:5000/api/chat-history",
        {
          question: currentQuestion,
          answer: botReply,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Something went wrong.",
        },
      ]);
    }

    setLoading(false);
  };

  // ---------------- HELPERS ----------------
  const clearChat = () => setMessages([]);

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const getMetricValue = (text, label) => {
    const regex = new RegExp(
      label + ".*?(\\d+\\.?\\d*)",
      "i"
    );

    const match = text?.match(regex);

    return match
      ? parseFloat(match[1])
      : null;
  };

  // ---------------- RISK ----------------
  const getRisk = (name, value) => {
    const metric = name.toLowerCase();
    const v = parseFloat(value);

    if (isNaN(v)) {
      return {
        status: "Detected",
        color: "text-blue-600",
        bg: "border-blue-500",
        pill: "bg-blue-100 text-blue-700",
      };
    }

    if (metric.includes("sugar")) {
      if (v < 70)
        return {
          status: "Low",
          color: "text-orange-500",
          bg: "border-orange-500",
          pill: "bg-orange-100 text-orange-700",
        };

      if (v <= 140)
        return {
          status: "Normal",
          color: "text-green-600",
          bg: "border-green-500",
          pill: "bg-green-100 text-green-700",
        };

      return {
        status: "High",
        color: "text-red-600",
        bg: "border-red-500",
        pill: "bg-red-100 text-red-700",
      };
    }

    if (metric.includes("hemoglobin")) {
      if (v < 12)
        return {
          status: "Low",
          color: "text-red-600",
          bg: "border-red-500",
          pill: "bg-red-100 text-red-700",
        };

      return {
        status: "Normal",
        color: "text-green-600",
        bg: "border-green-500",
        pill: "bg-green-100 text-green-700",
      };
    }

    if (metric.includes("cholesterol")) {
      if (v < 200)
        return {
          status: "Normal",
          color: "text-green-600",
          bg: "border-green-500",
          pill: "bg-green-100 text-green-700",
        };

      return {
        status: "High",
        color: "text-red-600",
        bg: "border-red-500",
        pill: "bg-red-100 text-red-700",
      };
    }

    return {
      status: "Detected",
      color: "text-blue-600",
      bg: "border-blue-500",
      pill: "bg-blue-100 text-blue-700",
    };
  };

  // ---------------- SUMMARY ----------------
  const summary = () => {
    let issues = 0;

    Object.entries(labs).forEach(
      ([k, v]) => {
        const risk = getRisk(
          k,
          v
        ).status.toLowerCase();

        if (
          risk.includes("high") ||
          risk.includes("low")
        ) {
          issues++;
        }
      }
    );

    if (issues >= 4)
      return {
        text: "High Risk",
        color: "text-red-600",
        bg: "bg-red-100",
      };

    if (issues >= 2)
      return {
        text: "Moderate Risk",
        color: "text-orange-500",
        bg: "bg-orange-100",
      };

    return {
      text: "Healthy",
      color: "text-green-600",
      bg: "bg-green-100",
    };
  };

  const overall = summary();

  // ---------------- CHART DATA ----------------
  const chartData = reports
    .slice()
    .reverse()
    .map((report, index) => ({
      name: `R${index + 1}`,
      sugar: getMetricValue(
        report.extractedText,
        "Blood Sugar"
      ),
      hb: getMetricValue(
        report.extractedText,
        "Hemoglobin"
      ),
      chol: getMetricValue(
        report.extractedText,
        "Cholesterol"
      ),
    }));

  // ---------------- PDF ----------------
  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(
      "MediAssist AI Summary",
      20,
      20
    );

    doc.setFontSize(12);
    doc.text(
      `Patient: ${user?.name}`,
      20,
      35
    );

    let y = 55;

    Object.entries(labs).forEach(
      ([k, v]) => {
        const risk = getRisk(k, v);

        doc.text(
          `${k}: ${v} (${risk.status})`,
          20,
          y
        );

        y += 10;
      }
    );

    doc.text(
      `Overall: ${overall.text}`,
      20,
      y + 10
    );

    doc.save("health-summary.pdf");
  };

  // ---------------- COMPARE ----------------
  const compareReports = () => {
    const r1 = reports.find(
      (r) => r._id === report1
    );

    const r2 = reports.find(
      (r) => r._id === report2
    );

    if (!r1 || !r2) return null;

    const keys = [
      "Blood Sugar",
      "Hemoglobin",
      "Cholesterol",
    ];

    return keys.map((key) => ({
      name: key,
      old: getMetricValue(
        r1.extractedText,
        key
      ),
      new: getMetricValue(
        r2.extractedText,
        key
      ),
    }));
  };

  const comparison = compareReports();

  // ---------------- REUSABLE CARD ----------------
  const StatCard = ({
    title,
    value,
    icon,
    color,
  }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-white/60 hover:scale-[1.02] transition duration-300">
      <div className="flex justify-between items-center mb-3">
        <p className="text-gray-500 text-sm">
          {title}
        </p>

        <div
          className={`p-3 rounded-2xl ${color}`}
        >
          {icon}
        </div>
      </div>

      <h2 className="text-3xl font-bold text-slate-800">
        {value}
      </h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 text-slate-800">
      {/* HEADER */}
      <div className="sticky top-0 z-50 px-8 py-4 border-b border-white/40 bg-white/70 backdrop-blur-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              MediAssist AI
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, {user?.name}
            </p>
          </div>

          <button
            onClick={logoutHandler}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl shadow-lg"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* TOP STATS */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="Reports"
            value={reports.length}
            icon={<Files size={20} />}
            color="bg-blue-100 text-blue-600"
          />

          <StatCard
            title="AI Status"
            value="Active"
            icon={<Sparkles size={20} />}
            color="bg-green-100 text-green-600"
          />

          <StatCard
            title="Metrics"
            value={Object.keys(labs).length}
            icon={<Activity size={20} />}
            color="bg-purple-100 text-purple-600"
          />

          <StatCard
            title="Overall"
            value={overall.text}
            icon={<ShieldCheck size={20} />}
            color={`${overall.bg} ${overall.color}`}
          />
        </div>

        {/* RISK DETECTION */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <HeartPulse className="text-pink-500" />
            <h2 className="text-2xl font-bold">Smart Risk Detection</h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Object.entries(labs).map(([key, value], index) => {
              const risk = getRisk(key, value);

              return (
                <div
                  key={index}
                  className={`rounded-3xl p-5 bg-gradient-to-br from-white to-slate-50 border-l-4 ${risk.bg} shadow-md`}
                >
                  <p className="text-gray-500">{key}</p>
                  <h2 className="text-3xl font-bold mt-2">{value}</h2>

                  <span
                    className={`inline-block mt-4 px-3 py-1 rounded-full text-sm font-semibold ${risk.pill}`}
                  >
                    {risk.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART + PDF */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <BarChart3 className="text-blue-600" />
              <h2 className="text-2xl font-bold">Health Trends</h2>
            </div>

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="sugar"
                    stroke="#ef4444"
                    strokeWidth={3}
                    name="Sugar"
                  />
                  <Line
                    type="monotone"
                    dataKey="hb"
                    stroke="#22c55e"
                    strokeWidth={3}
                    name="Hemoglobin"
                  />
                  <Line
                    type="monotone"
                    dataKey="chol"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Cholesterol"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
            <div>
              <p className="text-white/80">Health Summary</p>
              <h2 className="text-3xl font-bold mt-2">{overall.text}</h2>
              <p className="mt-3 text-sm text-white/90">
                Download a professional report summary for your records.
              </p>
            </div>

            <button
              onClick={downloadPDF}
              className="mt-6 bg-white text-blue-700 font-semibold py-3 rounded-2xl hover:scale-105 transition"
            >
              📄 Download PDF
            </button>
          </div>
        </div>

        {/* COMPARE */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-5">Compare Reports</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <select
              value={report1}
              onChange={(e) => setReport1(e.target.value)}
              className="border border-slate-200 p-3 rounded-2xl outline-none"
            >
              <option value="">Select Old Report</option>
              {reports.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.fileName}
                </option>
              ))}
            </select>

            <select
              value={report2}
              onChange={(e) => setReport2(e.target.value)}
              className="border border-slate-200 p-3 rounded-2xl outline-none"
            >
              <option value="">Select New Report</option>
              {reports.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.fileName}
                </option>
              ))}
            </select>
          </div>

          {comparison && (
            <div className="grid md:grid-cols-3 gap-4">
              {comparison.map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
                >
                  <p className="font-semibold">{item.name}</p>
                  <h3 className="text-lg mt-2">
                    {item.old ?? "--"} → {item.new ?? "--"}
                  </h3>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UPLOAD + CHAT */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <Upload className="text-blue-600" />
              <h2 className="text-xl font-bold">Upload Report</h2>
            </div>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border border-slate-200 rounded-2xl p-3 mb-4"
            />

            <button
              onClick={uploadHandler}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold"
            >
              Upload Now
            </button>
          </div>

          {/* Chat */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 flex flex-col h-[650px]">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-green-600" />
                MediAssist GPT
              </h2>

              <button
                onClick={clearChat}
                className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap shadow ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="bg-slate-100 px-4 py-3 rounded-2xl animate-pulse w-fit">
                  Thinking...
                </div>
              )}

              <div ref={chatEndRef}></div>
            </div>

            <div className="flex gap-2 mt-4">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askAI()}
                placeholder="Ask about your report..."
                className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 outline-none"
              />

              <button
                onClick={askAI}
                className="bg-green-600 hover:bg-green-700 text-white px-5 rounded-2xl"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* REPORT LIST */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <FileText className="text-blue-600" />
            <h2 className="text-2xl font-bold">My Reports</h2>
          </div>

          <div className="grid gap-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-3">
                  <p className="font-bold text-blue-600">
                    {report.fileName}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 text-sm max-h-56 overflow-y-auto whitespace-pre-wrap border border-slate-100">
                  {report.extractedText}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;