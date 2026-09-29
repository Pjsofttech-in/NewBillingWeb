import { ShieldCheck, GitBranch, LayoutGrid, Users } from "lucide-react";

export const authTabs = [
  {
    id: "superAdmin",
    label: "Super Admin",
    icon: ShieldCheck,
    accent: "text-blue-600",
    dot: "bg-blue-600",
    bar: "from-orange-400 to-amber-500",
    button: "bg-amber-500 hover:bg-amber-600",
    title: "Super Admin Access",
    subtitle: "Access the management portal",
    fields: [
      { id: "username", label: "Username / Email", type: "text", icon: "user" },
      { id: "password", label: "Password", type: "password", icon: "lock" },
    ],
  },
  {
    id: "branch",
    label: "Branch",
    icon: GitBranch,
    accent: "text-emerald-600",
    dot: "bg-emerald-600",
    bar: "from-emerald-400 to-teal-500",
    button: "bg-amber-500 hover:bg-amber-600",
    title: "Branch Access",
    subtitle: "Manage your branch operations",
    fields: [
      { id: "username", label: "Username / Email", type: "text", icon: "user" },
      { id: "password", label: "Password", type: "password", icon: "lock" },
    ],
  },
  {
    id: "department",
    label: "Department",
    icon: LayoutGrid,
    accent: "text-blue-600",
    dot: "bg-blue-600",
    bar: "from-blue-500 to-violet-500",
    button: "bg-amber-500 hover:bg-amber-600",
    title: "Department Access",
    subtitle: "Access department management console",
    fields: [
      { id: "username", label: "Username / Email", type: "text", icon: "user" },
      { id: "password", label: "Password", type: "password", icon: "lock" },
    ],
  },
  {
    id: "staff",
    label: "Staff",
    icon: Users,
    accent: "text-red-600",
    dot: "bg-red-600",
    bar: "from-red-500 to-rose-500",
    button: "bg-amber-500 hover:bg-amber-600",
    title: "Staff Access",
    subtitle: "Enter your staff credentials",
    fields: [
      { id: "username", label: "Username / Email", type: "text", icon: "user" },
      { id: "password", label: "Password", type: "password", icon: "lock" },
    ],
  },
];