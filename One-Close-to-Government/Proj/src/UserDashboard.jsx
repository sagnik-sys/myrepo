import { useContext, useMemo, useState } from "react";
import { NotificationContext } from "./NotificationContext";
import { useReports } from "./ReportsContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const { notifications } = useContext(NotificationContext);
  const { reports } = useReports();
  const navigate = useNavigate();

  // Filters
  const [issueFilter, setIssueFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Safe fallbacks
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  // Unique filter options (cleaned + sorted)
  const uniqueIssueTypes = useMemo(() => {
    const values = Array.from(
      new Set(
        safeReports
          .map((r) => (r && r.issueType ? String(r.issueType) : ""))
          .filter((v) => v && v.trim().length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));
    return ["All", ...values];
  }, [safeReports]);

  const uniqueDepartments = useMemo(() => {
    const values = Array.from(
      new Set(
        safeReports
          .map((r) => (r && r.department ? String(r.department) : ""))
          .filter((v) => v && v.trim().length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));
    return ["All", ...values];
  }, [safeReports]);

  // Apply filters + search
  const filteredReports = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return safeReports.filter((report) => {
      const issue = report?.issueType ? String(report.issueType) : "";
      const dept = report?.department ? String(report.department) : "";
      const desc = report?.description ? String(report.description) : "";
      const loc = report?.location ? String(report.location) : "";

      const issueMatch = issueFilter === "All" || issue === issueFilter;
      const departmentMatch = departmentFilter === "All" || dept === departmentFilter;

      if (query.length === 0) return issueMatch && departmentMatch;

      const searchMatch =
        desc.toLowerCase().includes(query) ||
        loc.toLowerCase().includes(query) ||
        issue.toLowerCase().includes(query) ||
        dept.toLowerCase().includes(query);

      return issueMatch && departmentMatch && searchMatch;
    });
  }, [safeReports, issueFilter, departmentFilter, searchQuery]);

  // Summary stats
  const stats = useMemo(() => {
    const summary = safeReports.reduce(
      (acc, r) => {
        const status = (r?.status ? String(r.status) : "Pending").toLowerCase();
        acc.total += 1;
        if (status.includes("resolve")) acc.resolved += 1;
        else if (status.includes("progress")) acc.inProgress += 1;
        else acc.pending += 1;
        return acc;
      },
      { total: 0, pending: 0, inProgress: 0, resolved: 0 }
    );
    return summary;
  }, [safeReports]);

  // Reset filters
  const resetFilters = () => {
    setIssueFilter("All");
    setDepartmentFilter("All");
    setSearchQuery("");
  };

  // Status color helper
  const statusColor = (status) => {
    const s = String(status || "Pending");
    if (s === "Resolved") return "bg-green-600";
    if (s.includes("Progress")) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {/* Dashboard Header + Stats */}
      <div className="pt-16 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <h1 className="text-5xl text-blue-700 font-bold tracking-tight">User Dashboard</h1>
          <div className="text-sm text-gray-500">{new Date().toLocaleString()}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <div className="text-xs text-gray-500">Total Reports</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <div className="text-xs text-gray-500">Pending</div>
            <div className="text-2xl font-semibold text-red-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <div className="text-xs text-gray-500">In Progress</div>
            <div className="text-2xl font-semibold text-yellow-600">{stats.inProgress}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <div className="text-xs text-gray-500">Resolved</div>
            <div className="text-2xl font-semibold text-green-600">{stats.resolved}</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        {safeNotifications.length === 0 ? (
          <p className="text-gray-500">No new notifications</p>
        ) : (
          <ul className="space-y-2">
            {safeNotifications.map((note, idx) => (
              <li
                key={note?.id ?? idx}
                className="p-3 bg-blue-100 rounded border border-blue-300"
              >
                {note?.message ?? ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reported Issues */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Your Reported Issues</h2>
          <div className="text-sm text-gray-500">
            Showing {filteredReports.length} of {safeReports.length}
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by description, location, issue or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Filter by Issue
            </label>
            <select
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-48"
            >
              {uniqueIssueTypes.map((type, idx) => (
                <option key={`${type}-${idx}`} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Filter by Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-48"
            >
              {uniqueDepartments.map((dept, idx) => (
                <option key={`${dept}-${idx}`} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports */}
        {filteredReports.length === 0 ? (
          <p className="text-gray-500">No reports match your search or filters.</p>
        ) : (
          <ul className="space-y-4">
            {filteredReports.map((report, index) => (
              <motion.li
                key={report?.id || index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-4 border rounded-lg bg-white shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-full">
                    <p className="text-sm text-blue-700 font-medium">
                      Report ID: #{report?.id ?? index + 1}
                    </p>

                    {Array.isArray(report?.images) && report.images.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto my-3">
                        {report.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Uploaded"
                            className="h-24 w-24 object-cover rounded-lg shadow"
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-gray-700">
                      <strong>Description:</strong>{" "}
                      {(report?.description ?? "").length > 180
                        ? `${String(report?.description).slice(0, 180)}...`
                        : String(report?.description ?? "No description provided")}
                    </p>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <p>
                        <strong>Issue:</strong> {report?.issueType ?? "-"}
                      </p>
                      <p>
                        <strong>Department:</strong> {report?.department ?? "-"}
                      </p>
                      <p>
                        <strong>Location:</strong> {report?.location ?? "-"}
                      </p>
                      <p className="flex items-center gap-2">
                        <strong>Status:</strong>
                        <span
                          className={`px-2 py-1 rounded text-white ${statusColor(
                            report?.status
                          )}`}
                        >
                          {report?.status || "Pending"}
                        </span>
                      </p>
                    </div>

                    {report?.voiceNote && (
                      <audio controls src={report.voiceNote} className="mt-3 w-full" />
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center justify-center gap-6 p-6">
        <motion.button
          onClick={() => navigate("/working-w")}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Report New Issue
        </motion.button>
      </div>
    </div>
  );
}