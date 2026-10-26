// Single source of truth: every fact on the site comes from this file.
// Counts, filters, the pipeline, the terminal and the command palette are derived from it (see derive.ts).
// Sources: the existing site copy and the CV in public/. Anything marked TODO is hidden on the live
// page until it is filled in. Never put guessed facts here.

/** Web3Forms public access key (registered to aleemdevops123@gmail.com; messages are delivered there).
 *  Public by design: Web3Forms keys are meant for client-side code. */
export const WEB3FORMS_ACCESS_KEY = '2cbba41a-88c4-4091-9e74-ad088da4dcde';

export const site = {
  // Public URL without a trailing slash. The GitHub Pages workflow sets NEXT_PUBLIC_SITE_URL automatically.
  // TODO: only set a value here if you move to a custom domain.
  url: (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, ''),
  // TODO: optional GoatCounter code (the "aleem" in aleem.goatcounter.com) to turn on privacy-friendly analytics.
  goatcounterCode: '',
};

export const profile = {
  name: 'Muhammad Aleem',
  firstName: 'Aleem',
  handle: 'aleem',
  role: 'DevOps Engineer',
  focus: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'], // CV headline
  description:
    'Muhammad Aleem is a DevOps Engineer in Lahore, Pakistan, working across AWS, Kubernetes, Terraform and CI/CD: cloud infrastructure, automated pipelines, container orchestration and observability.',
  location: { city: 'Lahore', country: 'Pakistan', timeZone: 'Asia/Karachi', zone: 'PKT' },
  availableForWork: true,
  email: 'aleemdevops123@gmail.com', // TODO: the CV lists muhammadaleemtoor@gmail.com; confirm which one recruiters should use
  phone: { display: '+92 314 0145490', href: 'tel:+923140145490', e164: '+923140145490' },
  whatsapp: 'https://wa.me/923140145490?text=Hi%20Aleem%2C%20I%20saw%20your%20portfolio%20and%20would%20like%20to%20talk.',
  github: 'https://github.com/aleemtoor222',
  githubUser: 'aleemtoor222',
  linkedin: 'https://www.linkedin.com/in/muhammad-aleem-89bab4336',
  // Lives in public/ under this exact name (GitHub Pages is case-sensitive)
  cv: { file: 'Muhammad_Aleem_DevOps_Engineer_Resume.pdf', downloadAs: 'Muhammad-Aleem-DevOps-Engineer-CV.pdf' },
};

export const hero = {
  title: ['Infrastructure that ships,', 'scales and stays observable.'],
  intro:
    'I design and run the platform behind production software: cloud servers, automated CI/CD pipelines and container orchestration, with monitoring, TLS and audit trails built in from day one.',
};

// From the CV's professional summary, in first person
export const about = {
  summary:
    'I’m a DevOps Engineer with 3+ years of experience automating deployments and managing cloud infrastructure as code on AWS, Azure and Hetzner Cloud. I design and maintain CI/CD pipelines with Jenkins and GitHub Actions, containerize applications with Docker, run them on Kubernetes (EKS/AKS) and provision AWS infrastructure with Terraform, backed by strong Linux, networking and security fundamentals and hands-on DevSecOps and observability work with Prometheus, Grafana and the ELK Stack.',
  strengths: ['Automation-first mindset', 'Incident response', 'Production troubleshooting', 'Security-by-default thinking', 'Documentation', 'Cross-team collaboration'],
  education: { school: 'University of Agriculture, Faisalabad', degree: 'Bachelor’s Degree' },
};

// The hero terminal types these once, then becomes interactive. "cmd" lines are typed, the rest appear as output.
export const terminalIntro: { kind: 'cmd' | 'out' | 'ok'; text: string }[] = [
  { kind: 'cmd', text: 'whoami' },
  { kind: 'out', text: 'muhammad-aleem · devops engineer' },
  { kind: 'cmd', text: 'kubectl get deploy -n three-tier' },
  { kind: 'out', text: 'frontend (nginx)   backend (fastapi)   mongodb' },
  { kind: 'cmd', text: 'gh workflow run build.yml' },
  { kind: 'ok', text: 'gradle build ✓ docker image ✓ slack notified' },
  { kind: 'cmd', text: 'curl -s prometheus:9090/api/v1/targets | jq length' },
  { kind: 'out', text: '11+ servers scraped · dashboards + alerts live' },
];

// ---------------------------------------------------------------------------------------------
// How I ship: the pipeline strip. The tools shown per stage come from `skills[].items[].stages`.
export type Stage = 'commit' | 'build' | 'test' | 'scan' | 'deploy' | 'monitor';

export const pipeline: { id: Stage; label: string; command: string; summary: string }[] = [
  { id: 'commit', label: 'commit', command: 'git push origin main', summary: 'Infrastructure and app changes are version-controlled in Git.' },
  { id: 'build', label: 'build', command: 'docker build -t app .', summary: 'Pipelines build every change into a container image.' },
  { id: 'test', label: 'test', command: 'run: tests', summary: 'Automated tests run inside the pipeline on every change.' },
  { id: 'scan', label: 'scan', command: 'trivy image app:latest', summary: 'Code-quality and vulnerability gates before anything ships.' },
  { id: 'deploy', label: 'deploy', command: 'helm upgrade --install', summary: 'Provisioned as code, rolled out with zero-downtime deploys.' },
  { id: 'monitor', label: 'monitor', command: 'promql up == 0', summary: 'Metrics, logs and alerts on everything that runs.' },
];

// ---------------------------------------------------------------------------------------------
// Skills. Each skill lives in exactly one group. `parts` render as sub-badges; `aliases` are the names
// projects use for the same tool (so clicking a chip can find the projects that use it).
export type SkillPart = string | { name: string; aliases: string[] };
export type Skill = { name: string; note?: string; parts?: SkillPart[]; aliases?: string[]; stages?: Stage[] };
export type SkillGroup = {
  id: string;
  title: string;
  command: string; // shown in the card's terminal title bar
  wide?: boolean; // spans two columns in the bento grid on large screens
  items: Skill[];
};

export const skills: SkillGroup[] = [
  {
    id: 'cloud',
    title: 'Cloud Platforms',
    command: 'aws sts get-caller-identity',
    wide: true,
    items: [
      {
        name: 'AWS',
        parts: ['EC2', 'ECS', { name: 'ECR', aliases: ['Amazon ECR'] }, 'Lambda', { name: 'S3', aliases: ['AWS S3', 'S3 Object Lock'] }, 'RDS', 'VPC', 'IAM', 'Route 53'],
      },
      { name: 'Azure', parts: ['VMs', 'Entra ID', 'Azure DevOps'] },
      { name: 'Hetzner Cloud' },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Observability',
    command: 'promql up == 0',
    items: [
      { name: 'Prometheus', stages: ['monitor'] },
      { name: 'Grafana', stages: ['monitor'] },
      { name: 'ELK Stack', parts: ['Elasticsearch', 'Logstash', 'Kibana'], stages: ['monitor'] },
      { name: 'Alertmanager', stages: ['monitor'] },
      { name: 'Jaeger', stages: ['monitor'] },
      { name: 'CloudWatch', stages: ['monitor'] },
      { name: 'Zabbix', stages: ['monitor'] },
    ],
  },
  {
    id: 'cicd',
    title: 'CI/CD & Infrastructure as Code',
    command: 'terraform plan',
    items: [
      { name: 'Git', note: 'GitHub · GitLab', stages: ['commit'] },
      { name: 'Terraform', note: 'HCL', stages: ['deploy'] },
      { name: 'Jenkins', stages: ['build', 'test'] },
      { name: 'GitHub Actions', stages: ['build', 'test'] },
      { name: 'GitLab CI/CD', stages: ['build', 'test'] },
      { name: 'ArgoCD', note: 'GitOps', stages: ['deploy'] },
      { name: 'Ansible', stages: ['deploy'] },
      { name: 'CloudFormation', stages: ['deploy'] },
    ],
  },
  {
    id: 'containers',
    title: 'Containers & Orchestration',
    command: 'kubectl get pods -A',
    items: [
      { name: 'Kubernetes', aliases: ['K3s', 'Kubernetes (EKS)'], stages: ['deploy'] },
      { name: 'AWS EKS', aliases: ['Kubernetes (EKS)'], stages: ['deploy'] },
      { name: 'Azure AKS', stages: ['deploy'] },
      { name: 'Docker & Docker Compose', aliases: ['Docker'], stages: ['build'] },
      { name: 'Helm', stages: ['deploy'] },
      { name: 'HPA', note: 'Autoscaling', stages: ['deploy'] },
    ],
  },
  {
    id: 'security',
    title: 'Security & DevSecOps',
    command: 'trivy image app:latest',
    items: [
      { name: 'SonarQube', stages: ['test', 'scan'] },
      { name: 'Trivy', stages: ['scan'] },
      { name: 'OWASP ZAP', stages: ['scan'] },
      { name: 'Wazuh', stages: ['monitor'] },
      { name: 'SSL/TLS', aliases: ['Let’s Encrypt', 'Certbot'] },
      { name: 'IAM Least-Privilege' },
      { name: 'SELinux' },
      { name: 'System Hardening' },
    ],
  },
  {
    id: 'web',
    title: 'Web, API & Caching',
    command: 'nginx -t',
    items: [
      { name: 'Nginx' },
      { name: 'Apache' },
      { name: 'HAProxy' },
      { name: 'AWS API Gateway' },
      { name: 'ALB Ingress', aliases: ['ALB ingress'] },
      { name: 'Redis' },
    ],
  },
  {
    id: 'linux',
    title: 'Linux & Networking',
    command: 'ssh ops@bastion',
    wide: true,
    items: [
      { name: 'Linux', parts: ['Ubuntu', 'CentOS', 'RHEL'] },
      { name: 'Bash Scripting', aliases: ['Bash'], stages: ['commit'] },
      { name: 'YAML', stages: ['commit'] },
      { name: 'Networking', parts: ['TCP/IP', 'DNS', 'DHCP'] },
      { name: 'LVM & Filesystems' },
      { name: 'SSH & ACLs' },
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Projects. The first `featured` project spans two columns in the Work grid.
export type Category = 'Orchestration' | 'CI/CD' | 'Observability' | 'Security' | 'Networking';
export type DiagramColumn = { label: string; nodes: string[] };
export type Project = {
  slug: string; // also the deep link: /#<slug> opens the case study
  file: string; // decorative "filename" in the card's title bar
  categories: Category[]; // first one is shown on the card
  title: string;
  summary: string;
  stack: string[];
  featured?: boolean;
  impact?: string; // TODO where empty: one measurable result per project
  diagram: DiagramColumn[]; // architecture flow, left to right, built only from the project's own stack
  caseStudy: {
    problem?: string; // TODO
    did: string[];
    decisions?: string[]; // TODO
    results?: string[]; // TODO
    improve?: string[]; // TODO
  };
  links: { code?: string; demo?: string }; // TODO: repository links
};

export const projects: Project[] = [
  {
    slug: 'eks-full-stack-monitoring',
    file: 'helm/values-prod.yaml',
    categories: ['Orchestration', 'Observability'],
    title: 'Production-Grade EKS Deployment with Full-Stack Monitoring',
    summary:
      'Provisioned the full AWS environment with Terraform and deployed the application to EKS through Helm charts, with HPA autoscaling, an ALB ingress with TLS, and Prometheus and Grafana monitoring with Alertmanager alerts.',
    stack: ['AWS EKS', 'Terraform', 'Docker', 'Amazon ECR', 'Helm', 'ALB ingress', 'HPA', 'Prometheus', 'Grafana', 'Alertmanager'],
    featured: true,
    impact: 'HPA absorbs traffic spikes without manual intervention',
    diagram: [
      { label: 'provision', nodes: ['Terraform', 'VPC · subnets · IAM'] },
      { label: 'package', nodes: ['Docker', 'Amazon ECR'] },
      { label: 'release', nodes: ['Helm charts', 'per-env values'] },
      { label: 'run', nodes: ['EKS node groups', 'HPA'] },
      { label: 'expose', nodes: ['ALB ingress', 'TLS'] },
      { label: 'observe', nodes: ['Prometheus', 'Grafana', 'Alertmanager'] },
    ],
    caseStudy: {
      did: [
        'Provisioned the full AWS environment with Terraform: VPC, subnets, security groups, IAM roles and an EKS cluster with managed node groups.',
        'Containerized the application with Docker, pushed images to Amazon ECR and deployed to EKS through Helm charts with per-environment values.',
        'Exposed services via an ALB ingress with TLS and configured the Horizontal Pod Autoscaler to absorb traffic spikes without manual intervention.',
        'Deployed Prometheus and Grafana dashboards for CPU, memory, pod restarts and request latency, plus Prometheus alerting rules (routed via Alertmanager) for CrashLoopBackOff and node pressure.',
      ],
    },
    links: {},
  },
  {
    slug: 'ai-multi-tier-eks',
    file: 'Jenkinsfile',
    categories: ['Orchestration', 'CI/CD', 'Security'],
    title: 'AI-Powered Multi-Tier Application Deployment',
    summary:
      'Deployed a multi-tier React – Node.js – MySQL application to Kubernetes (EKS) on AWS, with infrastructure provisioned through Terraform, automated CI/CD and zero-downtime deployments.',
    stack: ['AWS', 'Docker', 'Kubernetes (EKS)', 'Terraform', 'Jenkins', 'GitHub Actions', 'Prometheus', 'Grafana'],
    impact: 'Zero-downtime deployments with DevSecOps gates before release',
    diagram: [
      { label: 'provision', nodes: ['Terraform', 'AWS'] },
      { label: 'pipeline', nodes: ['Jenkins', 'GitHub Actions'] },
      { label: 'gates', nodes: ['build · test', 'security scan'] },
      { label: 'run on EKS', nodes: ['React', 'Node.js', 'MySQL'] },
      { label: 'observe', nodes: ['Prometheus', 'Grafana'] },
    ],
    caseStudy: {
      did: [
        'Deployed a multi-tier React – Node.js – MySQL application to Kubernetes (EKS) on AWS, with infrastructure provisioned through Terraform, automated CI/CD and zero-downtime deployments.',
        'Containerized every component with Docker for consistent deployments across environments.',
        'Automated build, test, security scanning and deployment through Jenkins and GitHub Actions, embedding DevSecOps gates before release.',
        'Set up Prometheus and Grafana for real-time monitoring and alerting.',
      ],
    },
    links: {},
  },
  {
    slug: 'k3s-three-tier',
    file: 'k3s-three-tier.yaml',
    categories: ['Orchestration'],
    title: 'K3s Cloud-Native Deployment',
    summary: 'Deployed a 3-tier application (Nginx frontend, FastAPI backend, MongoDB) using K3s orchestration on Hetzner Cloud.',
    stack: ['K3s', 'Hetzner Cloud', 'Nginx', 'FastAPI', 'MongoDB'],
    diagram: [
      { label: 'cloud', nodes: ['Hetzner Cloud'] },
      { label: 'orchestrate', nodes: ['K3s'] },
      { label: 'frontend', nodes: ['Nginx'] },
      { label: 'backend', nodes: ['FastAPI'] },
      { label: 'data', nodes: ['MongoDB'] },
    ],
    caseStudy: {
      did: ['Deployed a 3-tier application (Nginx frontend, FastAPI backend, MongoDB) using K3s orchestration on Hetzner Cloud.'],
    },
    links: {},
  },
  {
    slug: 'github-actions-slack',
    file: '.github/workflows/build.yml',
    categories: ['CI/CD'],
    title: 'Automated CI/CD & Slack Integrations',
    summary:
      'Authored complex GitHub Actions workflows to compile Java/Gradle apps, build Docker images, and send deployment status webhooks to Slack.',
    stack: ['GitHub Actions', 'Gradle', 'Java', 'Docker', 'Slack webhooks'],
    diagram: [
      { label: 'trigger', nodes: ['GitHub Actions'] },
      { label: 'compile', nodes: ['Java', 'Gradle'] },
      { label: 'package', nodes: ['Docker image'] },
      { label: 'notify', nodes: ['Slack webhook'] },
    ],
    caseStudy: {
      did: ['Authored complex GitHub Actions workflows to compile Java/Gradle apps, build Docker images, and send deployment status webhooks to Slack.'],
    },
    links: {},
  },
  {
    slug: 'monitoring-stack',
    file: 'prometheus.yml',
    categories: ['Observability'],
    title: 'Infrastructure Monitoring Stack',
    summary:
      'Designed and migrated persistent data volumes for Prometheus and Grafana, monitoring 11+ servers with custom dashboards and alerts.',
    stack: ['Prometheus', 'Grafana', 'Node Exporter', 'Blackbox Exporter'],
    impact: '11+ servers monitored with custom dashboards and alerts',
    diagram: [
      { label: 'targets', nodes: ['11+ servers'] },
      { label: 'exporters', nodes: ['Node Exporter', 'Blackbox Exporter'] },
      { label: 'collect', nodes: ['Prometheus', 'persistent volume'] },
      { label: 'visualise', nodes: ['Grafana dashboards', 'alerts'] },
    ],
    caseStudy: {
      did: ['Designed and migrated persistent data volumes for Prometheus and Grafana, monitoring 11+ servers with custom dashboards and alerts.'],
    },
    links: {},
  },
  {
    slug: 'iso-27001-audit',
    file: 'audit-profile.sh',
    categories: ['Security'],
    title: 'Security & Compliance Auditing',
    summary:
      'Implemented ISO 27001 standard command auditing via bash profile scripts, with automated monthly log archiving to AWS S3 using Object Lock.',
    stack: ['Bash', 'ISO 27001', 'AWS S3', 'S3 Object Lock'],
    diagram: [
      { label: 'capture', nodes: ['Bash profile scripts'] },
      { label: 'record', nodes: ['command audit log'] },
      { label: 'archive', nodes: ['monthly archive'] },
      { label: 'retain', nodes: ['AWS S3', 'Object Lock'] },
    ],
    caseStudy: {
      did: ['Implemented ISO 27001 standard command auditing via bash profile scripts, with automated monthly log archiving to AWS S3 using Object Lock.'],
    },
    links: {},
  },
  {
    slug: 'nginx-ha-proxies',
    file: 'nginx/upstreams.conf',
    categories: ['Networking'],
    title: 'High-Availability Proxies',
    // TODO: confirm the service name: SmsBridge or SmsFort?
    summary:
      'Configured Nginx load balancing and reverse proxies with automated Let’s Encrypt SSL termination for microservices like CryptoEngine and SmsBridge.',
    stack: ['Nginx', 'Load balancing', 'Certbot', 'Let’s Encrypt'],
    diagram: [
      { label: 'certificates', nodes: ['Let’s Encrypt', 'Certbot'] },
      { label: 'edge', nodes: ['Nginx', 'TLS termination', 'load balancing'] },
      { label: 'services', nodes: ['CryptoEngine', 'SmsBridge'] },
    ],
    caseStudy: {
      did: ['Configured Nginx load balancing and reverse proxies with automated Let’s Encrypt SSL termination for microservices like CryptoEngine and SmsBridge.'],
    },
    links: {},
  },
];

// ---------------------------------------------------------------------------------------------
// Experience, from the CV (three strongest bullets per role)
export type Role = { company: string; companyNote?: string; role: string; type: string; start: string; end: string; bullets: string[] };

export const experience: Role[] = [
  {
    company: 'DictaLabs',
    role: 'DevOps Engineer',
    type: 'Full-time',
    start: 'Mar 2026',
    end: 'Present',
    bullets: [
      'Manage and automate cloud infrastructure on AWS using Terraform, keeping every environment consistent, reproducible and fully version-controlled in Git.',
      'Run containerized workloads on Docker and Kubernetes, handling rolling updates, scaling and zero-downtime deployments, sustaining 99.9% uptime.',
      'Improved application performance by 30% through Redis caching and background task optimization.',
    ],
  },
  {
    company: 'BetaCodes',
    companyNote: 'formerly Forbmax',
    role: 'DevOps Engineer',
    type: 'Full-time',
    start: 'Oct 2024',
    end: 'Mar 2026',
    bullets: [
      'Designed and implemented CI/CD pipelines in Jenkins for automated build, test and deployment workflows, cutting deployment time by 40%.',
      'Integrated DevSecOps checks (SonarQube, Trivy, OWASP ZAP) into pipelines for code-quality and vulnerability scanning, reducing security incidents by 50%.',
      'Provisioned AWS infrastructure with Terraform (EC2, ECS, ECR, EKS, Lambda and VPC) with least-privilege IAM roles.',
    ],
  },
  {
    company: 'Digzy Tech',
    role: 'Linux Administrator / DevOps Engineer',
    type: 'Full-time',
    start: 'Aug 2023',
    end: 'Oct 2024',
    bullets: [
      'Managed Linux production servers (Ubuntu, CentOS) on AWS EC2, handling security hardening, patching and performance tuning.',
      'Configured and troubleshot TCP/IP networking: DNS, DHCP, subnetting and gateways.',
      'Performed log analysis and system monitoring, detecting and fixing production issues before user impact.',
    ],
  },
];

// TODO: add certifications (none are listed on the CV). The grid stays hidden while this is empty.
// Example shape: { name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', date: '2026-01', verifyUrl: 'https://…', badge: 'AWS' }
export type Certification = { name: string; issuer: string; date: string; verifyUrl?: string; badge?: string };
export const certifications: Certification[] = [];
