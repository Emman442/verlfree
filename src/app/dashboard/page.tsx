"use client";

import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Briefcase, CheckCircle2, Clock, Plus, Users } from "lucide-react";
import Link from "next/link";
import { 
  useFirestore, 
  useCollection, 
  useUser, 
  useMemoFirebase,
  useDoc
} from "@/firebase";
import { collection, query, where, collectionGroup, doc } from "firebase/firestore";

export default function Dashboard() {
  const db = useFirestore();
  const { user } = useUser();

  const clientJobsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "jobs"), where("clientId", "==", user.uid));
  }, [db, user]);
  const { data: jobs, isLoading: jobsLoading } = useCollection(clientJobsQuery);

  const appliedQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collectionGroup(db, "applications"), where("freelancerId", "==", user.uid));
  }, [db, user]);
  const { data: applications, isLoading: appsLoading } = useCollection(appliedQuery);

  const stats = [
    { label: "Total Escrowed", value: "2,450", suffix: " GEN", icon: Wallet },
    { label: "Active Jobs", value: jobs?.filter(j => j.status === 'Active').length || 0, suffix: "", icon: Briefcase },
    { label: "Completed", value: jobs?.filter(j => j.status === 'Completed').length || 0, suffix: "", icon: CheckCircle2 },
    { label: "Applications", value: applications?.length || 0, suffix: "", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              Welcome back, {user?.displayName || 'Builder'}
            </h1>
            <p className="text-muted-foreground">Manage your active escrows and track your applications.</p>
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Link href="/post-job">
              <Plus className="w-5 h-5 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {stat.value}
                    <span className="text-sm font-medium text-muted-foreground ml-1">{stat.suffix}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="mb-8 bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="open" className="px-6 data-[state=active]:bg-background">My Listings</TabsTrigger>
            <TabsTrigger value="active" className="px-6 data-[state=active]:bg-background">Active Projects</TabsTrigger>
            <TabsTrigger value="completed" className="px-6 data-[state=active]:bg-background">Completed</TabsTrigger>
            <TabsTrigger value="applied" className="px-6 data-[state=active]:bg-background">Applied Jobs</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {jobsLoading || appsLoading ? (
              <div className="p-12 text-center text-muted-foreground animate-pulse">Synchronizing data...</div>
            ) : (
              <>
                <TabsContent value="open" className="space-y-4">
                  {jobs?.filter(j => j.status === 'Open').length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">No open listings.</div>
                  )}
                  {jobs?.filter(j => j.status === 'Open').map((job, i) => (
                    <JobRow key={job.id} job={job} index={i} />
                  ))}
                </TabsContent>
                <TabsContent value="active" className="space-y-4">
                  {jobs?.filter(j => j.status === 'Active').length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">No active projects.</div>
                  )}
                  {jobs?.filter(j => j.status === 'Active').map((job, i) => (
                    <JobRow key={job.id} job={job} index={i} />
                  ))}
                </TabsContent>
                <TabsContent value="completed" className="space-y-4">
                  {jobs?.filter(j => j.status === 'Completed').map((job, i) => (
                    <JobRow key={job.id} job={job} index={i} />
                  ))}
                </TabsContent>
                <TabsContent value="applied" className="space-y-4">
                  {applications?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">You haven't applied to any jobs yet.</div>
                  )}
                  {applications?.map((app, i) => (
                    <ApplicationRow key={app.id} application={app} index={i} db={db} />
                  ))}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function ApplicationRow({ application, index, db }: { application: any; index: number; db: any }) {
  const jobRef = useMemoFirebase(() => doc(db, "jobs", application.jobId), [db, application.jobId]);
  const { data: job } = useDoc(jobRef);

  const statusColors: Record<string, string> = {
    "Pending": "bg-yellow-500",
    "Shortlisted": "bg-accent",
    "Selected": "bg-green-500",
    "Rejected": "bg-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/jobs/${application.jobId}`}>
        <Card className="hover:bg-accent/30 transition-all border-border/50 group">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                  {job?.title || "Loading..."}
                </h3>
                <Badge className={`${statusColors[application.status]} text-white border-none text-[10px]`}>
                  {application.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 italic">"{application.coverNote}"</p>
            </div>
            <Button size="sm" variant="ghost">View Job</Button>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function JobRow({ job, index }: { job: any; index: number }) {
  const statusColors: Record<string, string> = {
    "Open": "blue",
    "Active": "blue",
    "Completed": "green",
  };

  const applicantCount = job.applicantIds?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/jobs/${job.id}`}>
        <Card className="hover:bg-accent/50 transition-all border-border/50 group">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                {job.status === "Open" && (
                  <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                    <Users className="w-3 h-3 mr-1" />
                    {applicantCount} applicants
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {job.deadline}
                </span>
                <span className="flex items-center gap-1">
                  <Badge className={`h-1.5 w-1.5 rounded-full p-0 bg-${statusColors[job.status]}-500`} />
                  {job.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8 w-full md:w-auto justify-between">
              <div className="text-right">
                <p className="font-black text-lg">{job.budget} GEN</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Escrow</p>
              </div>
              <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all min-w-[120px]">
                {job.status === "Open" ? "View Applicants" : "Manage"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
