import { FiGitBranch, FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

const branches = [
  { id: "BR-001", name: "Bangalore HQ",    city: "Bangalore",  agents: 32, activeCases: 124, manager: "Rajesh Iyer" },
  { id: "BR-002", name: "Mumbai West",     city: "Mumbai",     agents: 28, activeCases: 98,  manager: "Sunita Shah" },
  { id: "BR-003", name: "Delhi North",     city: "Delhi",      agents: 24, activeCases: 87,  manager: "Pankaj Sharma" },
  { id: "BR-004", name: "Hyderabad",       city: "Hyderabad",  agents: 18, activeCases: 65,  manager: "Anita Reddy" },
  { id: "BR-005", name: "Pune",            city: "Pune",       agents: 15, activeCases: 54,  manager: "Sunil Pawar" },
  { id: "BR-006", name: "Chennai South",   city: "Chennai",    agents: 22, activeCases: 76,  manager: "Meera Nair" },
  { id: "BR-007", name: "Ahmedabad",       city: "Ahmedabad",  agents: 12, activeCases: 42,  manager: "Ravi Patel" },
  { id: "BR-008", name: "Jaipur",          city: "Jaipur",     agents: 10, activeCases: 35,  manager: "Sanjay Gupta" },
];

export default function BranchesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage all regional branch offices and their operations."
        action={
          <Button className="bg-[#1E3A5F] hover:bg-[#2A4E7F] text-white gap-2">
            <FiPlus className="w-4 h-4" />
            Add Branch
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="card-flat p-5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FiGitBranch className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">{b.id}</span>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-0.5" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {b.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{b.city}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400 mb-0.5">Agents</p>
                <p className="text-sm font-bold text-slate-900">{b.agents}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400 mb-0.5">Active Cases</p>
                <p className="text-sm font-bold text-slate-900">{b.activeCases}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Manager: <span className="font-medium text-slate-700">{b.manager}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
