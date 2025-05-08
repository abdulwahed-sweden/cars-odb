
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, PlusCircle, Trash2, Copy, Eye, EyeOff, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ApiToken {
  id: string;
  fullTokenForDisplayOnly?: string; // Only used immediately after generation
  tokenPrefix: string; 
  tokenSuffix: string; 
  tier: "Free" | "Pro" | "Enterprise";
  createdDate: string;
  lastUsed: string | null;
  status: "Active" | "Revoked";
  name: string;
}

const generateMockFullToken = (tier: "Free" | "Pro" | "Enterprise"): string => {
  return `cardoc_sk_${tier.toLowerCase().slice(0,3)}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2,10)}`;
};


export default function ApiTokensPage() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [selectedTier, setSelectedTier] = useState<"Free" | "Pro" | "Enterprise">("Free");
  const [newTokenName, setNewTokenName] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [generatedTokenForDialog, setGeneratedTokenForDialog] = useState<ApiToken | null>(null);
  const [tokenToRevoke, setTokenToRevoke] = useState<ApiToken | null>(null);
  const [visibleTokenParts, setVisibleTokenParts] = useState<Record<string, boolean>>({});


  useEffect(() => {
    // Load initial mock tokens
    const initialTokens: ApiToken[] = [
      { id: 'tok_abc123', name: 'My First Free Key', tokenPrefix: 'cardoc_sk_fre_abc123xy', tokenSuffix: 'z123', tier: 'Free', createdDate: '01/01/2024', lastUsed: '15/02/2024', status: 'Active' },
      { id: 'tok_def456', name: 'Main Production Key', tokenPrefix: 'cardoc_sk_pro_def456uv', tokenSuffix: 'w789', tier: 'Pro', createdDate: '10/12/2023', lastUsed: '20/03/2024', status: 'Active' },
      { id: 'tok_ghi789', name: 'Old Test Key', tokenPrefix: 'cardoc_sk_fre_ghi789st', tokenSuffix: 'r456', tier: 'Free', createdDate: '05/11/2023', lastUsed: '01/12/2023', status: 'Revoked'},
    ];
    setTokens(initialTokens);
  }, []);

  const handleGenerateToken = () => {
    if (!newTokenName.trim()) {
        toast({ title: "Name Required", description: "Please provide a name for your new token.", variant: "destructive"});
        return;
    }
    const fullToken = generateMockFullToken(selectedTier);
    const newToken: ApiToken = {
        id: `tok_${Math.random().toString(36).substring(2, 9)}`,
        fullTokenForDisplayOnly: fullToken, // Temporarily store for dialog
        tokenPrefix: fullToken.substring(0, 18), // e.g., cardoc_sk_pro_abc123
        tokenSuffix: fullToken.substring(fullToken.length - 4),
        tier: selectedTier,
        createdDate: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
        lastUsed: null,
        status: "Active",
        name: newTokenName,
    };
    // Add to state, but remove fullTokenForDisplayOnly for storage
    const { fullTokenForDisplayOnly, ...tokenForStorage } = newToken;
    setTokens(prev => [tokenForStorage, ...prev]);
    
    setGeneratedTokenForDialog(newToken); // Use the one with fullTokenForDisplayOnly for the dialog
    setShowTokenDialog(true);
    setNewTokenName(""); 
    toast({ title: "Token Generated", description: `New ${selectedTier} token "${newTokenName}" created successfully.` });
  };

  const handleRevokeToken = (tokenId: string) => {
    setTokens(prev =>
      prev.map(token =>
        token.id === tokenId ? { ...token, status: "Revoked" } : token
      )
    );
    const revokedToken = tokens.find(t => t.id === tokenId);
    setTokenToRevoke(null);
    toast({ title: "Token Revoked", description: `Token "${revokedToken?.name}" has been revoked.`, variant: "default" });
  };

  const copyToClipboard = (text: string | undefined, type: string = "Token") => {
    if(!text) {
        toast({ title: "Error", description: "No token to copy.", variant: "destructive"});
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${type} Copied`, description: `${type} copied to clipboard.` });
    }).catch(err => {
      toast({ title: `Failed to Copy ${type}`, description: "Could not copy to clipboard.", variant: "destructive" });
    });
  };

  const toggleTokenPartVisibility = (tokenId: string) => {
    setVisibleTokenParts(prev => ({...prev, [tokenId]: !prev[tokenId]}));
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
            <KeyRound size={30} className="shrink-0" /> API Tokens
          </CardTitle>
          <CardDescription>
            Manage your API access tokens based on your subscription plan.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Generate New Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div>
                <label htmlFor="tokenName" className="block text-sm font-medium text-muted-foreground mb-1">Token Name</label>
                <Input 
                    id="tokenName"
                    placeholder="e.g., My Staging Key" 
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="tokenTier" className="block text-sm font-medium text-muted-foreground mb-1">Subscription Tier</label>
                <Select value={selectedTier} onValueChange={(value: any) => setSelectedTier(value as "Free" | "Pro" | "Enterprise")}>
                    <SelectTrigger id="tokenTier">
                        <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Free">Free Tier</SelectItem>
                        <SelectItem value="Pro">Pro Tier</SelectItem>
                        <SelectItem value="Enterprise">Enterprise Tier</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleGenerateToken} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Generate Token
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Managed Tokens</CardTitle>
          <CardDescription>Your existing API tokens.</CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No API tokens generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map(token => (
                  <TableRow key={token.id} className={token.status === "Revoked" ? "opacity-60" : ""}>
                    <TableCell className="font-medium whitespace-nowrap">{token.name}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                        {visibleTokenParts[token.id] ? `${token.tokenPrefix}...${token.tokenSuffix}` : `${token.tokenPrefix.substring(0,12)}...${token.tokenSuffix}`}
                    </TableCell>
                    <TableCell><Badge variant={token.tier === "Pro" ? "default" : token.tier === "Enterprise" ? "destructive" : "secondary"} className="whitespace-nowrap">{token.tier}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap">{token.createdDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{token.lastUsed || "Never"}</TableCell>
                    <TableCell>
                      <Badge variant={token.status === "Active" ? "default" : "destructive"} className={`${token.status === "Active" ? "bg-green-500 hover:bg-green-600 text-white" : ""} whitespace-nowrap`}>
                        {token.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                       <Button variant="ghost" size="icon" onClick={() => toggleTokenPartVisibility(token.id)} title={visibleTokenParts[token.id] ? "Hide part of token" : "Show more of token"} disabled={token.status === "Revoked"}>
                         {visibleTokenParts[token.id] ? <EyeOff size={16}/> : <Eye size={16} />}
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`${token.tokenPrefix}...${token.tokenSuffix} (Full token is only shown once upon generation)`, "Partial Token ID")} title="Copy partial token ID" disabled={token.status === "Revoked"}>
                         <Copy size={16}/>
                       </Button>
                       <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setTokenToRevoke(token)} title="Revoke token" disabled={token.status === "Revoked"}>
                            <Trash2 size={16} className="text-destructive"/>
                        </Button>
                       </AlertDialogTrigger>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Usage Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
                To use your API token, include it in the <code>Authorization</code> header of your API requests using the Bearer scheme:
            </p>
            <pre className="p-3 rounded-md bg-muted text-sm overflow-x-auto">
                <code>{'GET /api/v1/codes/explain?code=P0123 HTTP/1.1\nHost: api.cardoc.example.com\nAuthorization: Bearer YOUR_API_TOKEN'}</code>
            </pre>
            <div className="flex items-start gap-3 p-3 rounded-md border border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                <Info size={24} className="mt-0.5 shrink-0"/>
                <p className="text-xs leading-relaxed">
                    <strong>Important Security Notice:</strong> Your full API token is displayed only once immediately after generation. 
                    It is crucial to copy and store it in a secure location at that time. CarDoc does not store your full token and cannot recover it if lost. 
                    We only store a prefix and suffix for identification purposes. If you suspect a token has been compromised, revoke it immediately from this page and generate a new one.
                </p>
            </div>
        </CardContent>
      </Card>

      {/* New Token Dialog */}
      {generatedTokenForDialog && (
        <AlertDialog open={showTokenDialog} onOpenChange={(isOpen) => {
            setShowTokenDialog(isOpen);
            if (!isOpen) setGeneratedTokenForDialog(null); // Clear token when dialog closes
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>API Token Generated: {generatedTokenForDialog.name}</AlertDialogTitle>
                <AlertDialogDescription>
                    Your new API token has been generated. Please copy it now. 
                    <strong className="text-destructive"> You will not be able to see the full token again after closing this dialog.</strong>
                </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4 p-3 rounded-md bg-muted font-mono text-sm break-all relative">
                    {generatedTokenForDialog.fullTokenForDisplayOnly}
                    <Button variant="outline" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => copyToClipboard(generatedTokenForDialog.fullTokenForDisplayOnly, "Full API Token")}>
                        <Copy size={16}/>
                    </Button>
                </div>
                <AlertDialogFooter>
                <AlertDialogAction onClick={() => {setShowTokenDialog(false); setGeneratedTokenForDialog(null);}}>
                    I have copied my token
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

       {/* Revoke Token Confirmation Dialog */}
      {tokenToRevoke && (
        <AlertDialog open={!!tokenToRevoke} onOpenChange={(isOpen) => !isOpen && setTokenToRevoke(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Revoke API Token: "{tokenToRevoke.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to revoke this token? This action cannot be undone, and any applications using this token will lose API access immediately.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTokenToRevoke(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => handleRevokeToken(tokenToRevoke.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Yes, Revoke Token
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
