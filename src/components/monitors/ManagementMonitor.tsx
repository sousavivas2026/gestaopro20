import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Cake, AlertCircle, DollarSign, Wrench, ShoppingBag } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import MarketplaceSlide from "@/components/monitor/MarketplaceSlide";
import { useSoundAlert } from "@/contexts/SoundAlertContext";
import { MonitorAudioControls } from "./MonitorAudioControls";

type ViewType = 'marketplace' | 'expenses' | 'birthdays' | 'services_summary' | 'financial_overview' | 'accounts_payable' | 'services_in_progress' | 'machines_ok' | 'machines_defective' | 'sales_overview' | 'production_overview';

export function ManagementMonitor() {
  const [currentView, setCurrentView] = useState<ViewType>("marketplace");
  const { playAlert } = useSoundAlert();
  
  const views: ViewType[] = ['marketplace', 'financial_overview', 'accounts_payable', 'expenses', 'services_in_progress', 'services_summary', 'sales_overview', 'production_overview', 'machines_ok', 'machines_defective', 'birthdays'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentView(prev => {
        const currentIndex = views.indexOf(prev);
        const nextIndex = (currentIndex + 1) % views.length;
        return views[nextIndex];
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [views]);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-monitor'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*');
      if (error) throw error;
      const today = new Date();
      return (data || []).filter((exp: any) => {
        if (!exp.due_date || exp.paid) return false;
        const dueDate = parseISO(exp.due_date);
        const daysUntil = differenceInDays(dueDate, today);
        return daysUntil >= -2 && daysUntil <= 7;
      }).sort((a: any, b: any) => differenceInDays(parseISO(a.due_date), parseISO(b.due_date)));
    },
    refetchInterval: 5000,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-monitor'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      const today = new Date();
      return (data || []).filter((emp: any) => {
        if (!emp.birth_date) return false;
        const birthDate = parseISO(emp.birth_date);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const daysUntil = differenceInDays(thisYearBirthday, today);
        return daysUntil >= 0 && daysUntil <= 30;
      }).sort((a: any, b: any) => {
        const dateA = parseISO(a.birth_date);
        const dateB = parseISO(b.birth_date);
        const todayA = new Date(today.getFullYear(), dateA.getMonth(), dateA.getDate());
        const todayB = new Date(today.getFullYear(), dateB.getMonth(), dateB.getDate());
        return differenceInDays(todayA, today) - differenceInDays(todayB, today);
      });
    },
    refetchInterval: 5000,
  });

  const { data: servicesData = [] } = useQuery({
    queryKey: ['services-monitor'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-monitor'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales').select('*');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: productionOrders = [] } = useQuery({
    queryKey: ['production-monitor'],
    queryFn: async () => {
      const { data, error } = await supabase.from('production_orders').select('*');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: machines = [] } = useQuery({
    queryKey: ['machines-monitor'],
    queryFn: async () => {
      const { data, error } = await supabase.from('machines_vehicles').select('*');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const totalServices = servicesData.reduce((sum: number, service: any) => sum + (service.total_value || 0), 0);
  const totalSales = sales.reduce((sum: number, sale: any) => sum + (sale.total_revenue || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.value || 0), 0);
  const totalProfit = totalSales - totalExpenses;
  
  const servicesInProgress = servicesData.filter((s: any) => s.status === 'pendente' || s.status === 'em_andamento');
  const machinesOk = machines.filter((m: any) => m.status === 'ativo');
  const machinesDefective = machines.filter((m: any) => m.status === 'manutencao' || m.status === 'defeito');
  const accountsPayable = expenses.filter((e: any) => !e.paid);
  const pendingProduction = productionOrders.filter((p: any) => p.status === 'pendente');
  const inProgressProduction = productionOrders.filter((p: any) => p.status === 'em_producao');

  const getViewTitle = () => {
    switch(currentView) {
      case 'marketplace': return 'PEDIDOS MARKETPLACE';
      case 'financial_overview': return 'VISÃO FINANCEIRA';
      case 'accounts_payable': return 'CONTAS A PAGAR';
      case 'expenses': return 'PAGAMENTOS URGENTES';
      case 'services_in_progress': return 'SERVIÇOS EM ANDAMENTO';
      case 'services_summary': return 'RESUMO DE SERVIÇOS';
      case 'sales_overview': return 'RESUMO DE VENDAS';
      case 'production_overview': return 'VISÃO DE PRODUÇÃO';
      case 'machines_ok': return 'MÁQUINAS ATIVAS';
      case 'machines_defective': return 'MÁQUINAS COM DEFEITO';
      case 'birthdays': return 'ANIVERSARIANTES';
    }
  };

  const getViewIcon = () => {
    switch(currentView) {
      case 'marketplace': return <ShoppingBag className="w-16 h-16 text-purple-400" />;
      case 'financial_overview': return <DollarSign className="w-16 h-16 text-green-400" />;
      case 'accounts_payable': return <AlertCircle className="w-16 h-16 text-orange-400" />;
      case 'expenses': return <AlertCircle className="w-16 h-16 text-red-400" />;
      case 'services_in_progress': return <Wrench className="w-16 h-16 text-blue-400" />;
      case 'services_summary': return <Wrench className="w-16 h-16 text-indigo-400" />;
      case 'sales_overview': return <ShoppingBag className="w-16 h-16 text-emerald-400" />;
      case 'production_overview': return <ShoppingBag className="w-16 h-16 text-cyan-400" />;
      case 'machines_ok': return <AlertCircle className="w-16 h-16 text-green-400" />;
      case 'machines_defective': return <AlertCircle className="w-16 h-16 text-red-400" />;
      case 'birthdays': return <Cake className="w-16 h-16 text-pink-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8">
      <MonitorAudioControls context="management" />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            {getViewIcon()}
            <h1 className="text-6xl font-bold text-white">{getViewTitle()}</h1>
          </div>
          <p className="text-2xl text-slate-300">
            {format(new Date(), "dd 'de' MMMM 'de' yyyy - HH:mm", { locale: ptBR })}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {views.map((view) => (
              <div 
                key={view}
                className={`w-3 h-3 rounded-full ${currentView === view ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {currentView === 'marketplace' && <MarketplaceSlide />}
          
          {currentView === 'expenses' && (
            <>
              {expenses.length === 0 ? (
                <div className="text-center py-20">
                  <AlertCircle className="w-24 h-24 mx-auto mb-6 text-slate-600" />
                  <p className="text-3xl text-slate-400">Nenhuma conta pendente!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {expenses.map((expense: any) => {
                    const dueDate = parseISO(expense.due_date);
                    const daysUntil = differenceInDays(dueDate, new Date());
                    let urgency = "Em Dia";
                    let urgencyColor = "text-green-300";
                    if (daysUntil < 0) {
                      urgency = "Urgente";
                      urgencyColor = "text-red-300";
                    } else if (daysUntil <= 2) {
                      urgency = "Próximo";
                      urgencyColor = "text-yellow-300";
                    }

                    return (
                      <Card key={expense.id} className="bg-gradient-to-br from-red-900 to-orange-900 border-2 border-red-600 shadow-2xl">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
                            <h3 className="text-2xl font-bold text-white mb-2">{expense.description}</h3>
                            <p className="text-orange-200 mb-4">
                              Vencimento em {format(dueDate, "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <div className="bg-black/30 rounded-lg p-4 mb-4">
                              <p className="text-red-300 text-lg">Valor</p>
                              <p className="text-4xl font-bold text-white">R$ {expense.amount}</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4">
                              <p className={urgencyColor + " text-lg"}>Status</p>
                              <p className="text-3xl font-bold text-white">{urgency}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
          
          {currentView === 'birthdays' && (
            <>
              {employees.length === 0 ? (
                <div className="text-center py-20">
                  <Cake className="w-24 h-24 mx-auto mb-6 text-slate-600" />
                  <p className="text-3xl text-slate-400">Nenhum aniversariante no próximo mês!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {employees.map((employee: any) => {
                    const birthDate = parseISO(employee.birth_date);
                    const today = new Date();
                    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                    const daysUntil = differenceInDays(thisYearBirthday, today);

                    return (
                      <Card key={employee.id} className="bg-gradient-to-br from-pink-900 to-red-900 border-2 border-pink-600 shadow-2xl">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Cake className="w-16 h-16 mx-auto mb-4 text-pink-300" />
                            <h3 className="text-2xl font-bold text-white mb-2">{employee.name}</h3>
                            <p className="text-pink-200 mb-4">
                              Aniversário em {format(birthDate, "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <div className="bg-black/30 rounded-lg p-4">
                              <p className="text-red-300 text-lg">Faltam</p>
                              <p className="text-4xl font-bold text-white">{daysUntil} dias</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {currentView === 'financial_overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-600 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-green-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">Total Vendas</h3>
                    <p className="text-4xl font-bold text-white">R$ {totalSales.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-900 to-orange-900 border-2 border-red-600 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">Total Despesas</h3>
                    <p className="text-4xl font-bold text-white">R$ {totalExpenses.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 border-2 border-blue-600 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">Lucro Líquido</h3>
                    <p className="text-4xl font-bold text-white">R$ {totalProfit.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === 'accounts_payable' && (
            <>
              {accountsPayable.length === 0 ? (
                <div className="text-center py-20">
                  <DollarSign className="w-24 h-24 mx-auto mb-6 text-slate-600" />
                  <p className="text-3xl text-slate-400">Todas as contas pagas!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accountsPayable.map((account: any) => (
                    <Card key={account.id} className="bg-gradient-to-br from-orange-900 to-yellow-900 border-2 border-orange-600 shadow-2xl">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                          <h3 className="text-2xl font-bold text-white mb-2">{account.description}</h3>
                          <div className="bg-black/30 rounded-lg p-4 mb-4">
                            <p className="text-orange-300 text-lg">Valor</p>
                            <p className="text-4xl font-bold text-white">R$ {account.value?.toFixed(2)}</p>
                          </div>
                          {account.due_date && (
                            <p className="text-orange-200">Vencimento: {format(parseISO(account.due_date), "dd/MM/yyyy")}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {currentView === 'services_in_progress' && (
            <>
              {servicesInProgress.length === 0 ? (
                <div className="text-center py-20">
                  <Wrench className="w-24 h-24 mx-auto mb-6 text-slate-600" />
                  <p className="text-3xl text-slate-400">Nenhum serviço em andamento!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {servicesInProgress.map((service: any) => (
                    <Card key={service.id} className="bg-gradient-to-br from-blue-900 to-cyan-900 border-2 border-blue-600 shadow-2xl">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Wrench className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                          <h3 className="text-2xl font-bold text-white mb-2">{service.service_type}</h3>
                          <p className="text-blue-200 mb-4">Cliente: {service.customer_name}</p>
                          <div className="bg-black/30 rounded-lg p-4 mb-4">
                            <p className="text-blue-300 text-lg">Valor</p>
                            <p className="text-4xl font-bold text-white">R$ {service.total_value?.toFixed(2)}</p>
                          </div>
                          <Badge className="bg-blue-600 text-lg px-4 py-2">
                            {service.status === 'pendente' ? 'PENDENTE' : 'EM ANDAMENTO'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {currentView === 'services_summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-indigo-900 to-violet-900 border-2 border-indigo-600 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Wrench className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">Total de Serviços</h3>
                    <p className="text-4xl font-bold text-white">R$ {totalServices.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === 'sales_overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-emerald-900 to-green-900 border-2 border-emerald-600 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">Total Vendas</h3>
                    <p className="text-4xl font-bold text-white">{sales.length}</p>
                    <p className="text-2xl text-emerald-200 mt-4">R$ {totalSales.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === 'production_overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-cyan-900 to-blue-900 border-2 border-cyan-600 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-cyan-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">Pedidos Pendentes</h3>
                    <p className="text-4xl font-bold text-white">{pendingProduction.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-indigo-600 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">Em Produção</h3>
                    <p className="text-4xl font-bold text-white">{inProgressProduction.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === 'machines_ok' && (
            <>
              {machinesOk.length === 0 ? (
                <div className="text-center py-20">
                  <AlertCircle className="w-24 h-24 mx-auto mb-6 text-slate-600" />
                  <p className="text-3xl text-slate-400">Nenhuma máquina ativa!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {machinesOk.map((machine: any) => (
                    <Card key={machine.id} className="bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-600 shadow-2xl">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                          <h3 className="text-2xl font-bold text-white mb-2">{machine.name}</h3>
                          <p className="text-green-200 mb-4">{machine.type}</p>
                          <Badge className="bg-green-600 text-lg px-4 py-2">ATIVO</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {currentView === 'machines_defective' && (
            <>
              {machinesDefective.length === 0 ? (
                <div className="text-center py-20">
                  <AlertCircle className="w-24 h-24 mx-auto mb-6 text-slate-600" />
                  <p className="text-3xl text-slate-400">Nenhuma máquina com defeito!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {machinesDefective.map((machine: any) => (
                    <Card key={machine.id} className="bg-gradient-to-br from-red-900 to-orange-900 border-2 border-red-600 shadow-2xl">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
                          <h3 className="text-2xl font-bold text-white mb-2">{machine.name}</h3>
                          <p className="text-red-200 mb-4">{machine.type}</p>
                          <Badge className="bg-red-600 text-lg px-4 py-2">
                            {machine.status === 'manutencao' ? 'MANUTENÇÃO' : 'DEFEITO'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
