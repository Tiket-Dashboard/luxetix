import { useState } from "react";
import { Loader2, Search, MoreHorizontal, Key, UserCog, AlertCircle, UserPlus, Trash2, Shield, ShieldOff, UserCheck, UserX } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  phone: string | null;
  status: "active" | "suspended" | "inactive";
  status_message: string | null;
  roles: string[];
  is_agent: boolean;
  agent_status: string | null;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Dialog states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [newStatus, setNewStatus] = useState<"active" | "suspended" | "inactive">("active");
  const [statusMessage, setStatusMessage] = useState("");
  
  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [agentBusinessName, setAgentBusinessName] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list_users" },
      });

      if (error) throw error;
      return data.users as User[];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, full_name, role }: { 
      email: string; 
      password: string; 
      full_name: string;
      role: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "create_user", email, password, full_name, role },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "User berhasil ditambahkan" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menambah user", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete_user", user_id: userId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "User berhasil dihapus" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menghapus user", description: error.message, variant: "destructive" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "update_password", user_id: userId, new_password: password },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Password berhasil diubah" });
      setPasswordDialogOpen(false);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengubah password", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, message }: { userId: string; status: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "update_status", user_id: userId, status, status_message: message },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Status berhasil diubah" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setStatusDialogOpen(false);
      setStatusMessage("");
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengubah status", description: error.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, add }: { userId: string; role: string; add: boolean }) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "update_role", user_id: userId, role, add },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: variables.add ? "Role admin berhasil ditambahkan" : "Role admin berhasil dihapus" 
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengubah role", description: error.message, variant: "destructive" });
    },
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async ({ userId, makeAgent, businessName }: { userId: string; makeAgent: boolean; businessName?: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "toggle_agent", user_id: userId, make_agent: makeAgent, business_name: businessName },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: variables.makeAgent ? "Role agent berhasil ditambahkan" : "Role agent berhasil dihapus" 
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setAgentDialogOpen(false);
      setAgentBusinessName("");
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengubah role agent", description: error.message, variant: "destructive" });
    },
  });

  const resetCreateForm = () => {
    setNewEmail("");
    setNewUserPassword("");
    setNewFullName("");
    setNewRole("user");
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.phone?.includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: "Aktif", className: "bg-green-500/20 text-green-500" },
      suspended: { label: "Ditangguhkan", className: "bg-yellow-500/20 text-yellow-500" },
      inactive: { label: "Tidak Aktif", className: "bg-red-500/20 text-red-500" },
    };
    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getRoleBadges = (roles: string[], isAgent: boolean, agentStatus: string | null) => {
    const badges = [];
    
    if (roles.includes("admin")) {
      badges.push(
        <Badge key="admin" className="bg-purple-500/20 text-purple-500">Admin</Badge>
      );
    }
    
    if (isAgent) {
      const agentColor = agentStatus === "active" ? "bg-blue-500/20 text-blue-500" : "bg-gray-500/20 text-gray-500";
      badges.push(
        <Badge key="agent" className={agentColor}>
          Agent {agentStatus !== "active" && `(${agentStatus})`}
        </Badge>
      );
    }
    
    if (badges.length === 0) {
      badges.push(
        <Badge key="user" variant="outline">User</Badge>
      );
    }
    
    return badges;
  };

  const handleCreateUser = () => {
    if (!newEmail.trim()) {
      toast({ title: "Email wajib diisi", variant: "destructive" });
      return;
    }
    if (!newUserPassword || newUserPassword.length < 6) {
      toast({ title: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({
      email: newEmail,
      password: newUserPassword,
      full_name: newFullName,
      role: newRole,
    });
  };

  const handlePasswordChange = () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    updatePasswordMutation.mutate({ userId: selectedUser.id, password: newPassword });
  };

  const handleStatusChange = () => {
    if (!selectedUser) return;
    updateStatusMutation.mutate({ userId: selectedUser.id, status: newStatus, message: statusMessage });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setPasswordDialogOpen(true);
  };

  const openStatusDialog = (user: User) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setStatusMessage(user.status_message || "");
    setStatusDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleToggleAdmin = () => {
    if (!selectedUser) return;
    const isAdmin = selectedUser.roles.includes("admin");
    updateRoleMutation.mutate({ 
      userId: selectedUser.id, 
      role: "admin", 
      add: !isAdmin 
    });
  };

  const openAgentDialog = (user: User) => {
    setSelectedUser(user);
    setAgentBusinessName("");
    setAgentDialogOpen(true);
  };

  const handleToggleAgent = () => {
    if (!selectedUser) return;
    const isAgent = selectedUser.is_agent && selectedUser.agent_status === "active";
    
    if (!isAgent && !agentBusinessName.trim()) {
      toast({ title: "Nama bisnis wajib diisi", variant: "destructive" });
      return;
    }
    
    toggleAgentMutation.mutate({ 
      userId: selectedUser.id, 
      makeAgent: !isAgent,
      businessName: agentBusinessName
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Kelola Pengguna</h2>
            <p className="text-muted-foreground">
              Lihat dan kelola semua pengguna terdaftar
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah User
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari email, nama, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Tidak ada pengguna ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Pengguna
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Terakhir Login
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{user.full_name || "-"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.phone && (
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {getRoleBadges(user.roles, user.is_agent, user.agent_status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getStatusBadge(user.status)}
                          {user.status_message && (
                            <p className="text-xs text-muted-foreground">{user.status_message}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {user.last_sign_in_at
                          ? format(new Date(user.last_sign_in_at), "dd MMM yyyy, HH:mm")
                          : "Belum pernah"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                              <Key className="w-4 h-4 mr-2" />
                              Ubah Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusDialog(user)}>
                              <UserCog className="w-4 h-4 mr-2" />
                              Ubah Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                              {user.roles.includes("admin") ? (
                                <>
                                  <ShieldOff className="w-4 h-4 mr-2" />
                                  Hapus Role Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Jadikan Admin
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAgentDialog(user)}>
                              {user.is_agent && user.agent_status === "active" ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Hapus Role Agent
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Jadikan Agent
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Buat akun user baru secara manual
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Password *</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-full-name">Nama Lengkap</Label>
                <Input
                  id="new-full-name"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nama lengkap user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tambah User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus User?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus user <strong>{selectedUser?.email}</strong>? 
                Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait user ini.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ubah Password</DialogTitle>
              <DialogDescription>
                Ubah password untuk {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handlePasswordChange}
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ubah Status Pengguna</DialogTitle>
              <DialogDescription>
                Ubah status untuk {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as typeof newStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="suspended">Ditangguhkan</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newStatus !== "active" && (
                <div className="space-y-2">
                  <Label htmlFor="status-message">Pesan (opsional)</Label>
                  <Textarea
                    id="status-message"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="Alasan suspend atau pesan untuk user..."
                    rows={3}
                  />
                </div>
              )}
              {newStatus !== "active" && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-500">
                    User dengan status ini dapat login tetapi akan melihat pesan warning.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleStatusChange}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Dialog */}
        <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedUser?.roles.includes("admin") ? "Hapus Role Admin?" : "Jadikan Admin?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedUser?.roles.includes("admin") ? (
                  <>
                    Anda yakin ingin menghapus role admin dari <strong>{selectedUser?.email}</strong>? 
                    User ini tidak akan bisa mengakses panel admin lagi.
                  </>
                ) : (
                  <>
                    Anda yakin ingin menjadikan <strong>{selectedUser?.email}</strong> sebagai admin? 
                    User ini akan mendapatkan akses penuh ke panel admin.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleAdmin}
                disabled={updateRoleMutation.isPending}
                className={selectedUser?.roles.includes("admin") 
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                  : ""
                }
              >
                {updateRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedUser?.roles.includes("admin") ? "Hapus Admin" : "Jadikan Admin"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Agent Role Dialog */}
        <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser?.is_agent && selectedUser?.agent_status === "active" 
                  ? "Hapus Role Agent?" 
                  : "Jadikan Agent?"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.is_agent && selectedUser?.agent_status === "active" ? (
                  <>
                    Anda yakin ingin menghapus role agent dari <strong>{selectedUser?.email}</strong>? 
                    User ini tidak akan bisa membuat event lagi.
                  </>
                ) : (
                  <>
                    Jadikan <strong>{selectedUser?.email}</strong> sebagai agent untuk membuat dan mengelola event.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {!(selectedUser?.is_agent && selectedUser?.agent_status === "active") && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-business-name">Nama Bisnis *</Label>
                  <Input
                    id="agent-business-name"
                    value={agentBusinessName}
                    onChange={(e) => setAgentBusinessName(e.target.value)}
                    placeholder="Nama bisnis agent"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAgentDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleToggleAgent}
                disabled={toggleAgentMutation.isPending}
                variant={selectedUser?.is_agent && selectedUser?.agent_status === "active" ? "destructive" : "default"}
              >
                {toggleAgentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedUser?.is_agent && selectedUser?.agent_status === "active" 
                  ? "Hapus Agent" 
                  : "Jadikan Agent"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;