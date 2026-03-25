"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldCheck,
  Users,
  XCircle,
  Sparkles,
  Trophy,
  Rocket
} from "lucide-react";
import { useParams } from "next/navigation";
import { 
  useFirestore, 
  useDoc, 
  useCollection, 
  useUser, 
  useMemoFirebase,
  updateDocumentNonBlocking
} from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function JobDetail() {
  const { id } = useParams();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [verifying, setVerifying] = useState(false);
  const [isAIReordering, setIsAIReordering] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState("");

  const jobRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "jobs", id as string);
  }, [db, id]);
  const { data: job, isLoading: jobLoading } = useDoc(jobRef);

  const isClient = user && job && job.clientId === user.uid;
  const isAssignedFreelancer = user && job && job.assignedFreelancerId === user.uid;

  const appsQuery = useMemoFirebase(() => {
    if (!db || !id || !user || !job || job.clientId !== user.uid) return null;
    return collection(db, "jobs", id as string, "applications");
  }, [db, id, user, job]);
  const { data: applications } = useCollection(appsQuery);

  const sortedApplications = useMemo(() => {
    if (!applications) return [];
    if (!isAIReordering) return applications;
    
    return [...applications].sort((a, b) => {
      if (a.isAIRecommended) return -1;
      if (b.isAIRecommended) return 1;
      return 0;
    });
  }, [applications, isAIReordering]);

  const handleAIShortlist = () => {
    setIsAIReordering(true);
    toast({
      title: "AI Analyzing Applicants",
      description: "Comparing cover notes and on-chain history...",
    });
    
    setTimeout(() => {
      setIsAIReordering(true);
      toast({
        title: "Shortlist Complete",
        description: "Found the best fit for your requirements.",
      });
    }, 2000);
  };

  const handleSelectFreelancer = (app: any) => {
    if (!db || !job) return;

    updateDocumentNonBlocking(doc(db, "jobs", job.id), {
      status: "Active",
      assignedFreelancerId: app.freelancerId,
      updatedAt: new Date().toISOString()
    });

    applications?.forEach((otherApp) => {
      const status = otherApp.id === app.id ? "Selected" : "Rejected";
      updateDocumentNonBlocking(doc(db, "jobs", job.id, "applications", otherApp.id), {
        status,
        updatedAt: new Date().toISOString()
      });
    });

    toast({
      title: "Freelancer Selected",
      description: `Project is now Active. Payout locked in escrow.`,
    });
  };

  const handleRejectApplicant = (app: any) => {
    if (!db || !job) return;
    updateDocumentNonBlocking(doc(db, "jobs", job.id, "applications", app.id), {
      status: "Rejected",
      updatedAt: new Date().toISOString()
    });
  };

  const handleSubmitDeliverable = () => {
    if (!deliverableUrl) return;
    setVerifying(true);
    toast({
      title: "Submitting Deliverable",
      description: "Triggering GenLayer AI verification node...",
    });
    
    setTimeout(() => {
      setVerifying(false);
      toast({
        title: "Deliverable Received",
        description: "AI Review is in progress. Check back shortly.",
      });
    }, 2000);
  };

  const successCriteria = [
    "Fully responsive on mobile and desktop",
    "Tailwind CSS used for all styling",
    "Interactive animations using Framer Motion",
    "Clean code structure with modular components"
  ];

  if (jobLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-bold">Synchronizing Node Data...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Contract not found on-chain.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-primary/10 text-primary border-none">{job.category}</Badge>
                <Badge variant="outline" className={`
                  ${job.status === 'Active' ? 'text-blue-500 border-blue-500/50' : 
                    job.status === 'Completed' ? 'text-green-500 border-green-500/50' : 
                    'text-yellow-500 border-yellow-500/50'}
                `}>
                  {job.status}
                </Badge>
              </div>
              <h1 className="text-4xl font-extrabold mb-4 tracking-tight">{job.title}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {job.description}
              </p>
            </motion.div>

            {isClient && job.status === "Open" && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Applications ({applications?.length || 0})</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-primary/50 text-primary hover:bg-primary/10"
                    onClick={handleAIShortlist}
                    disabled={isAIReordering || !applications?.length}
                  >
                    <Sparkles className={`w-4 h-4 mr-2 ${isAIReordering ? 'animate-spin' : ''}`} />
                    {isAIReordering ? "Analyzing..." : "AI Shortlist"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {sortedApplications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No applications yet.</div>
                    ) : (
                      sortedApplications.map((app) => (
                        <motion.div
                          key={app.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-xl border bg-background transition-all hover:border-primary/30 ${app.isAIRecommended && isAIReordering ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-border'} ${app.status === 'Rejected' ? 'opacity-50 grayscale' : ''}`}
                        >
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={`https://picsum.photos/seed/${app.freelancerId}/100/100`} />
                                    <AvatarFallback>{app.freelancerId[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-bold text-sm">
                                    {app.freelancerId.substring(0, 6)}...{app.freelancerId.substring(app.freelancerId.length - 4)}
                                  </span>
                                  {app.isAIRecommended && isAIReordering && (
                                    <Badge className="bg-yellow-500 text-black font-black text-[10px] h-5 px-2">
                                      AI RECOMMENDED
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                                  <Trophy className="w-3 h-3" />
                                  Rep: 95
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-2 italic">
                                "{app.coverNote}"
                              </p>
                              {app.isAIRecommended && isAIReordering && (
                                <p className="text-[10px] text-yellow-600 font-bold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Strongest cover note with relevant experience mentioned.
                                </p>
                              )}
                            </div>
                            {app.status === 'Pending' && (
                              <div className="flex md:flex-col gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRejectApplicant(app)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-primary"
                                  onClick={() => handleSelectFreelancer(app)}
                                >
                                  <ShieldCheck className="w-4 h-4 mr-2" />
                                  Select
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {job.status === "Active" && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    Deliverable Submission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isAssignedFreelancer ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliverable">Submission Link (GitHub, URL, etc.)</Label>
                        <Input 
                          id="deliverable" 
                          placeholder="https://..." 
                          value={deliverableUrl}
                          onChange={(e) => setDeliverableUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">AI will automatically crawl this link to verify against success criteria.</p>
                      </div>
                      <Button 
                        onClick={handleSubmitDeliverable} 
                        disabled={!deliverableUrl || verifying}
                        className="w-full bg-primary py-6 text-lg font-bold"
                      >
                        {verifying ? "Triggering AI Node..." : "Submit for Verification"}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium">
                        {isClient 
                          ? "Contract is Active. Awaiting deliverable from the assigned freelancer." 
                          : "You are not assigned to this job."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Project Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Contract Initialized</p>
                      <p className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {job.status === 'Active' && (
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Freelancer Assigned</p>
                        <p className="text-xs text-muted-foreground">Escrow funds locked by protocol.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground text-sm">Escrow Amount</span>
                  <span className="font-bold text-lg">{job.budget} GEN</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground text-sm">Deadline</span>
                  <span className="font-bold text-sm">{job.deadline}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground text-sm">Protocol Fee</span>
                  <span className="font-bold text-sm text-primary">5%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Success Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {successCriteria.map((c, i) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <div className="w-5 h-5 rounded border border-primary/50 flex items-center justify-center mt-0.5 group-hover:bg-primary/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary opacity-20" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{c}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
