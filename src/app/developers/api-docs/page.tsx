
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Terminal } from "lucide-react";

// Simple CodeBlock component for demonstration
const CodeBlock = ({ children, language = "json" }: { children: React.ReactNode; language?: string }) => (
  <pre className={`p-4 rounded-md bg-muted overflow-x-auto text-sm language-${language}`}>
    <code>{children}</code>
  </pre>
);

export default function ApiDocsPage() {
  const endpoints = [
    {
      id: "explain-code",
      method: "POST",
      path: "/api/v1/codes/explain",
      title: "Explain Diagnostic Code",
      description: "Provides an AI-generated explanation for a given Diagnostic Trouble Code (DTC), including severity and possible causes.",
      parameters: [
        { name: "code", type: "string", required: true, description: "The DTC to explain (e.g., P0300)." },
        { name: "vehicleDetails", type: "string", required: false, description: "Optional vehicle context (e.g., '2022 Nissan Altima')." },
      ],
      requestExample: JSON.stringify(
        {
          code: "P0420",
          vehicleDetails: "2021 Ford F-150",
        },
        null,
        2
      ),
      responseExample: JSON.stringify(
        {
          explanation: "The P0420 code indicates that the Catalyst System Efficiency is Below Threshold for Bank 1...",
          severity: "Medium",
          possibleCauses: "Faulty catalytic converter, exhaust leak, faulty oxygen sensor(s), engine misfire.",
        },
        null,
        2
      ),
    },
    {
      id: "vehicle-scan",
      method: "POST",
      path: "/api/v1/vehicle/scan",
      title: "Initiate Vehicle Scan",
      description: "Triggers a diagnostic scan on the connected vehicle. Requires an active OBD connection.",
      parameters: [
        { name: "vin", type: "string", required: true, description: "Vehicle Identification Number." },
        { name: "modules", type: "string[]", required: false, description: "Specific modules to scan (e.g., ['ECU', 'TCM']). Defaults to all." },
      ],
      requestExample: JSON.stringify(
        {
          vin: "JN1AZ0000FAKEVIN",
          modules: ["ECU", "ABS"]
        },
        null,
        2
      ),
      responseExample: JSON.stringify(
        {
          scanId: "scan_123xyz",
          status: "initiated",
          estimatedCompletionTime: "120s",
          message: "Vehicle scan initiated for ECU, ABS.",
        },
        null,
        2
      ),
    },
     {
      id: "get-scan-results",
      method: "GET",
      path: "/api/v1/vehicle/scan/{scanId}",
      title: "Get Scan Results",
      description: "Retrieves the results of a previously initiated vehicle scan.",
      parameters: [
        { name: "scanId", type: "string", pathParam: true, required: true, description: "The ID of the scan to retrieve." },
      ],
      requestExample: "N/A (GET request with path parameter)",
      responseExample: JSON.stringify(
        {
          scanId: "scan_123xyz",
          status: "completed",
          vehicleInfo: { vin: "JN1AZ0000FAKEVIN", make: "Nissan", model: "Altima", year: "2022" },
          detectedCodes: [
            { code: "P0300", description: "Random/Multiple Cylinder Misfire Detected", severity: "high" },
            { code: "U0100", description: "Lost Communication With ECM/PCM \"A\"", severity: "high" },
          ],
          moduleStatus: [
            { name: "Engine Control Unit (ECU)", status: "complete" },
            { name: "Anti-lock Braking System (ABS)", status: "complete" },
          ]
        },
        null,
        2
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
            <Terminal size={30} className="shrink-0" /> API Documentation
          </CardTitle>
          <CardDescription>
            Welcome to the CarDoc API. Integrate vehicle diagnostics into your applications.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="introduction" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="introduction">Introduction</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="introduction">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
              <p>
                The CarDoc API provides programmatic access to vehicle diagnostic functionalities, including code explanation and vehicle scanning.
                All API requests should be made to <code>https://api.cardoc.example.com/v1</code>.
              </p>
              <p>
                To use the API, you will need an API key associated with your subscription tier. See the Authentication tab for more details.
              </p>
              <h3>Key Features:</h3>
              <ul>
                <li>AI-powered explanations for Diagnostic Trouble Codes (DTCs).</li>
                <li>Initiate and retrieve vehicle scan results.</li>
                <li>Access vehicle information and module status.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
              <p>
                All API requests must be authenticated using an API key. Pass your API key in the <code>Authorization</code> header with the Bearer scheme:
              </p>
              <CodeBlock language="bash">
                {'Authorization: Bearer YOUR_API_KEY'}
              </CodeBlock>
              <p>
                API keys are tied to your subscription plan (Free, Pro, Enterprise) and can be managed in the "API Tokens" section of the developer portal.
              </p>
              <h3>OAuth 2.0 (Future)</h3>
              <p>
                We plan to introduce OAuth 2.0 for more granular access control in the future. Stay tuned for updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
              <p>
                API access is rate-limited based on your subscription tier to ensure fair usage and stability. Exceeding these limits will result in a <code>429 Too Many Requests</code> error.
              </p>
              <ul>
                <li><strong>Free Tier:</strong> 100 requests/day, 1 request/second.</li>
                <li><strong>Pro Tier:</strong> 5,000 requests/day, 10 requests/second.</li>
                <li><strong>Enterprise Tier:</strong> Custom limits, contact sales.</li>
              </ul>
              <p>
                Rate limit information is returned in the following HTTP headers with each response:
              </p>
              <ul>
                  <li><code>X-RateLimit-Limit</code>: The maximum number of requests allowed in the current window.</li>
                  <li><code>X-RateLimit-Remaining</code>: The number of requests remaining in the current window.</li>
                  <li><code>X-RateLimit-Reset</code>: The Unix timestamp (seconds) when the current window resets.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Detailed reference for all available API endpoints.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {endpoints.map((endpoint) => (
                  <AccordionItem value={endpoint.id} key={endpoint.id}>
                    <AccordionTrigger className="hover:bg-muted/50 px-3 py-3 rounded-md text-left">
                      <div className="flex items-center gap-3 w-full">
                        <Badge variant={endpoint.method === "GET" ? "default" : "secondary"} className={`${endpoint.method === "POST" ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"} shrink-0`}>
                          {endpoint.method}
                        </Badge>
                        <span className="font-mono text-sm break-all">{endpoint.path}</span>
                        <span className="text-muted-foreground text-sm ml-auto hidden md:inline truncate">
                          {endpoint.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 px-4 pt-3 pb-4 border-t mt-1">
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      
                      <h4 className="font-semibold text-base">Parameters:</h4>
                      {endpoint.parameters.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                          {endpoint.parameters.map((param) => (
                            <li key={param.name}>
                              <span className="font-mono">{param.name}</span> ({param.type})
                              {param.required && <Badge variant="outline" className="ml-2 text-xs border-destructive text-destructive">Required</Badge>}
                              {param.pathParam && <Badge variant="outline" className="ml-2 text-xs">Path Param</Badge>}
                              : {param.description}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-muted-foreground">None.</p>}

                      <h4 className="font-semibold text-base mt-3">Request Example:</h4>
                      <CodeBlock language="json">{endpoint.requestExample}</CodeBlock>

                      <h4 className="font-semibold text-base mt-3">Response Example (200 OK):</h4>
                      <CodeBlock language="json">{endpoint.responseExample}</CodeBlock>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Interactive Console</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Coming soon! An interactive console to test API calls directly from your browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
