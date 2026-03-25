
"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Users,
  XCircle,
  Sparkles,
  Trophy
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
import { doc, collection, query, where, writeBatch } from "firebase/firestore";
import { aiDeliverableVerification } from "@/ai/flows/ai-deliverable-verification-flow";
import { aiVerificationExplanation } from "@/ai/flows/ai-verification-explanation-flow";
import { useToast } from "@/hooks/use-toast";

export default function JobDetail() {
  const { id } = useParams();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [verifying, setVerifying] = useState(false);
  const [verdict, setVerdict] = useState<any>(null);
  const [isAIReordering, setIsAIReordering] = useState(false);

  // Firestore Data
  const jobRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "jobs", id as string);
  }, [db, id]);
  const { data: job, isLoading: jobLoading } = useDoc(jobRef);

  const appsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return collection(db, "jobs", id as string, "applications");
  }, [db, id]);
  const { data: applications } = useCollection(appsQuery);

  const isClient = user && job && job.clientId === user.uid;

  // AI Shortlist Demo Logic
  const sortedApplications = useMemo(() => {
    if (!applications) return [];
    if (!isAIReordering) return applications;
    
    const sorted = [...applications].sort((a, b) => {
      if (a.isAIRecommended) return -1;
      if (b.isAIRecommended) return 1;
      return 0;
    });
    return sorted;
  }, [applications, isAIReordering]);

  const handleAIShortlist = () => {
    setIsAIReordering(true);
    toast({
      title: "AI Analyzing Applicants",
      description: "Comparing cover notes and on-chain history...",
    });
    
    // Simulate reordering with delay
    setTimeout(() => {
      // In a real app, we'd update Firestore fields via a flow
      // For this UI demo, we'll just trigger the sorted state
      toast({
        title: "Shortlist Complete",
        description: "Found the best fit for your requirements.",
      });
    }, 2000);
  };

  const handleSelectFreelancer = (app: any) => {
    if (!db || !job) return;

    // Update Job
    updateDocumentNonBlocking(doc(db, "jobs", job.id), {
      status: "Active",
      assignedFreelancerId: app.freelancerId
    });

    // Update all applications (Selected vs Rejected)
    applications?.forEach((otherApp) => {
      const status = otherApp.id === app.id ? "Selected" : "Rejected";
      updateDocumentNonBlocking(doc(db, "jobs", job.id, "applications", otherApp.id), {
        status
      });
    });

    toast({
      title: "Freelancer Selected",
      description: `${app.freelancerId.substring(0, 6)}... assigned to the job.`,
    });
  };

  const handleRejectApplicant = (app: any) => {
    if (!db || !job) return;
    updateDocumentNonBlocking(doc(db, "jobs", job.id, "applications", app.id), {
      status: "Rejected"
    });
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
        <div className="animate-pulse text-primary font-bold">Loading Job Details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Job not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
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

            {/* Applications Section for Client */}
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
                      sortedApplications.map((app, idx) => (
                        <motion.div
                          key={app.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-4 rounded-xl border bg-background transition-all hover:border-primary/30 ${app.isAIRecommended && isAIReordering ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-border'}`}
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
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 italic">
                                "{app.coverNote}"
                              </p>
                              {app.isAIRecommended && isAIReordering && (
                                <div className="text-[10px] text-yellow-500 font-medium bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10 mb-2">
                                  AI Verdict: {app.aiRecommendationReason || "Strongest cover note with relevant experience mentioned."}
                                </div>
                              )}
                            </div>
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
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {/* Submission / Verification Section for Active Jobs */}
            {job.status === "Active" && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Project Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logic for freelancer view vs client view would go here */}
                  <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Project is currently active. Awaiting deliverable submission.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chat */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Project Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12 text-muted-foreground">
                  Connect your wallet to start chatting with the {isClient ? 'freelancer' : 'client'}.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground text-sm">Platform Fee</span>
                  <span className="font-bold text-sm">5%</span>
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
