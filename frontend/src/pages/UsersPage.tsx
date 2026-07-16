import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Shield, UserX, UserCheck, Search, Users, LogIn, AlertTriangle, Clock } from "lucide-react"
import { getUsers, getStats, getLoginActivity, updateRole, disableUser, enableUser } from "../services/api"
import { useState } from "react"

const ROLES = ["admin", "hr", "manager", "employee"]

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 30000,
  })

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    refetchInterval: 30000,
  })


  const { data: loginActivity = [], isLoading: loginLoading, error: loginError } = useQuery({
    queryKey: ["loginActivity"],
    queryFn: getLoginActivity,
    refetchInterval: 30000,
  })


  console.log("loginActivity:", loginActivity, "error:", loginError)

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  })

  const disableMut = useMutation({
    mutationFn: (id: number) => disableUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      qc.invalidateQueries({ queryKey: ["stats"] })
    },
  })

  const enableMut = useMutation({
    mutationFn: (id: number) => enableUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      qc.invalidateQueries({ queryKey: ["stats"] })
    },
  })

  const filteredUsers = users.filter(
    (u: any) =>
      !search || u.email.toLowerCase().includes(search.toLowerCase())
  )


  return (
    <div className="p-8">
      {/* Stats Dashboard */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Users className="text-indigo-600" size={20} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_users ?? 0}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="text-green-600" size={20} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_users ?? 0}</p>
                <p className="text-xs text-gray-500">Active Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <LogIn className="text-blue-600" size={20} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.logins_today ?? 0}</p>
                <p className="text-xs text-gray-500">Logins Today</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={20} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.failed_attempts_today ?? 0}</p>
                <p className="text-xs text-gray-500">Failed Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users by role */}
        <div className="mt-4 flex gap-3">
          {Object.entries(stats?.users_by_role || {}).map(([role, count]: [string, any]) => (
            <div key={role} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs">
              <span className="font-medium text-indigo-600">{role}:</span>{" "}
              <span className="text-gray-700">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Login Activity */}
      {loginLoading ? (
        <p className="text-gray-400 mb-4">Loading activity...</p>
      ) : (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            Recent Login Activity
            <span className="text-xs text-gray-500 font-normal">({loginActivity?.length || 0} records)</span>
            {loginError && <span className="text-red-500 text-xs font-normal">- Error loading</span>}
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">User</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Action</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Time</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loginActivity && loginActivity.length > 0 ? (
                    loginActivity.slice(0, 10).map((log: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-800">{log.user_email || log.user_id}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            log.action === "login" ? "bg-green-100 text-green-700" : 
                            log.action === "logout" ? "bg-gray-100 text-gray-700" : 
                            "bg-red-100 text-red-700"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs font-mono">
                          {log.ip_address || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-400">
                        No login activity yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-indigo-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Login</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">IP</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Logins</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pwd Changed</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Recent Activity</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.full_name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
                        disabled={!u.is_active}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                      {u.last_login_ip ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {u.login_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.password_last_changed ? new Date(u.password_last_changed).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.recent_activity?.slice(0, 2).map((a: any, i: number) => (
                        <div key={i} className="truncate">{a.action}</div>
                      )) ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <button
                          onClick={() => disableMut.mutate(u.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Disable user"
                        >
                          <UserX size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => enableMut.mutate(u.id)}
                          className="p-1 text-green-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Enable user"
                        >
                          <UserCheck size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
