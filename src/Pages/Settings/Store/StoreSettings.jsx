import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Building2, Landmark, ScrollText} from "lucide-react";

import {
  fetchStoreProfile,
  updateStoreProfile,
  fetchBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  fetchTermsAndConditions,
  updateTermsAndConditions,
} from "../../../api/storeSettingsApi";
import Input from "../../../Components/Form/Input";
import Select from "../../../Components/Form/Select";
import Checkbox from "../../../Components/Form/Checkbox";
import Toast from "../../../Components/Toast";

const SUB_TABS = [
  {id: "profile", label: "Store Profile", icon: Building2},
  {id: "bank", label: "Bank Details", icon: Landmark},
  {id: "terms", label: "Terms & Conditions", icon: ScrollText},
];

const StoreProfileForm = ({showToast}) => {
  const queryClient = useQueryClient();
  const {data, isLoading} = useQuery({
    queryKey: ["storeSettings", "profile"],
    queryFn: fetchStoreProfile,
  });

  const {register, handleSubmit, reset} = useForm({
    defaultValues: {
      storeName: "",
      address: "",
      phoneNumber: "",
      email: "",
      gstin: "",
    },
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: updateStoreProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["storeSettings", "profile"]});
      showToast("Store profile updated successfully!");
    },
    onError: (err) =>
      showToast(
        err.response?.data?.message || "Failed to update store profile",
        "error",
      ),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading store profile...</p>;
  }

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Store Name"
          name="storeName"
          register={register}
          placeholder="e.g. Inventory Management System Inc."
        />
        <Input
          label="GSTIN"
          name="gstin"
          register={register}
          placeholder="27AAAAA0000A1Z5"
        />
        <Input
          label="Phone Number"
          name="phoneNumber"
          register={register}
          placeholder="9876543210"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          register={register}
          placeholder="support@yourstore.com"
        />
      </div>
      <Input
        label="Address"
        name="address"
        register={register}
        placeholder="Full store address"
      />
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="cursor-pointer rounded-lg bg-[#0073b7] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#0867a0] disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save Store Profile"}
        </button>
      </div>
    </form>
  );
};

const BankDetailsForm = ({showToast}) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const {data: accounts = [], isLoading} = useQuery({queryKey:["storeSettings","bankAccounts"],queryFn:fetchBankAccounts});
  const {register,handleSubmit,reset,formState:{errors}} = useForm({defaultValues:{accountName:"",bankName:"",accountNumber:"",ifscCode:"",branchName:"",upiId:"",accountType:"SAVINGS",acceptingPayments:true,active:true,defaultAccount:false}});
  const save = useMutation({mutationFn:(values)=>editing?updateBankAccount({id:editing.id,...values}):createBankAccount(values),onSuccess:()=>{queryClient.invalidateQueries({queryKey:["storeSettings","bankAccounts"]});showToast(editing?"Bank account updated":"Bank account added");setEditing(null);reset();},onError:e=>showToast(e.response?.data?.message||"Unable to save bank account","error")});
  const remove = useMutation({mutationFn:deleteBankAccount,onSuccess:()=>{queryClient.invalidateQueries({queryKey:["storeSettings","bankAccounts"]});showToast("Bank account removed")},onError:e=>showToast(e.response?.data?.message||"Unable to remove account","error")});
  const edit=a=>{setEditing(a);reset(a)};
  const cancel=()=>{setEditing(null);reset()};
  if(isLoading)return <p className="text-sm text-slate-500">Loading bank accounts...</p>;
  return <div className="space-y-5"><div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">Add multiple Savings or Current accounts. Enable <b>Accepting Payments</b> only for accounts customers are allowed to pay into. Mark one account as default.</div><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[900px] text-sm"><thead><tr className="bg-slate-50 text-left text-xs uppercase text-slate-500"><th className="p-3">Account</th><th className="p-3">Bank / Type</th><th className="p-3">Account No.</th><th className="p-3">UPI</th><th className="p-3">Accepting</th><th className="p-3">Active</th><th className="p-3">Default</th><th className="p-3">Actions</th></tr></thead><tbody>{accounts.length===0?<tr><td colSpan="8" className="p-5 text-center text-slate-400">No bank accounts added.</td></tr>:accounts.map(a=><tr key={a.id} className="border-t"><td className="p-3 font-semibold">{a.accountName||"—"}</td><td className="p-3">{a.bankName}<br/><span className="text-xs text-slate-500">{a.accountType}</span></td><td className="p-3">{a.accountNumber}</td><td className="p-3">{a.upiId||"—"}</td><td className="p-3">{a.acceptingPayments?"Yes":"No"}</td><td className="p-3">{a.active?"Yes":"No"}</td><td className="p-3">{a.defaultAccount?"Yes":"No"}</td><td className="p-3"><button onClick={()=>edit(a)} className="mr-2 text-blue-600">Edit</button><button onClick={()=>remove.mutate(a.id)} className="text-red-600">Delete</button></td></tr>)}</tbody></table></div><form onSubmit={handleSubmit(v=>save.mutate(v))} className="space-y-4 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-800">{editing?`Edit ${editing.accountName||"Bank Account"}`:"Add Bank Account"}</h3>{editing&&<button type="button" onClick={cancel} className="text-sm text-slate-500">Cancel edit</button>}</div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><Input label="Account Name" name="accountName" register={register} rules={{required:"Account name is required"}} error={errors.accountName} required placeholder="Main UPI Account"/><Input label="Bank Name" name="bankName" register={register} rules={{required:"Bank name is required"}} error={errors.bankName} required/><Select label="Account Type" name="accountType" register={register} rules={{required:"Select account type"}} error={errors.accountType} options={[{value:"SAVINGS",label:"Savings"},{value:"CURRENT",label:"Current"}]}/><Input label="Account Number" name="accountNumber" register={register} rules={{required:"Account number is required"}} error={errors.accountNumber} required/><Input label="IFSC Code" name="ifscCode" register={register}/><Input label="Branch Name" name="branchName" register={register}/><Input label="UPI ID" name="upiId" register={register}/></div><div className="flex flex-wrap gap-5"><Checkbox label="Accepting Payments" name="acceptingPayments" register={register}/><Checkbox label="Active" name="active" register={register}/><Checkbox label="Default Account" name="defaultAccount" register={register}/></div><div className="flex justify-end border-t pt-4"><button type="submit" disabled={save.isPending} className="rounded-lg bg-[#0073b7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{save.isPending?"Saving...":editing?"Update Account":"Add Account"}</button></div></form></div>;
};

const TermsForm = ({showToast}) => {
  const queryClient = useQueryClient();
  const {data, isLoading} = useQuery({
    queryKey: ["storeSettings", "terms"],
    queryFn: fetchTermsAndConditions,
  });

  const {register, handleSubmit, reset} = useForm({
    defaultValues: {termsAndConditions: ""},
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: updateTermsAndConditions,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["storeSettings", "terms"]});
      showToast("Terms & Conditions updated successfully!");
    },
    onError: (err) =>
      showToast(
        err.response?.data?.message || "Failed to update terms",
        "error",
      ),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading terms...</p>;
  }

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
    >
      <div className="w-full">
        <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
          Terms &amp; Conditions
        </label>
        <textarea
          rows={10}
          {...register("termsAndConditions")}
          placeholder="Enter the terms &amp; conditions shown on invoices..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
        />
      </div>
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="cursor-pointer rounded-lg bg-[#0073b7] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#0867a0] disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save Terms & Conditions"}
        </button>
      </div>
    </form>
  );
};

const StoreSettings = () => {
  const [activeSubTab, setActiveSubTab] = useState("profile");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({message, type});

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                isActive
                  ? "bg-[#0073b7] text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === "profile" && <StoreProfileForm showToast={showToast} />}
      {activeSubTab === "bank" && <BankDetailsForm showToast={showToast} />}
      {activeSubTab === "terms" && <TermsForm showToast={showToast} />}
    </div>
  );
};

export default StoreSettings;
