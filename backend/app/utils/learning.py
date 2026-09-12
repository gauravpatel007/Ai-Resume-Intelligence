"""
Editable mapping from skills to learning/practice advice.
"""

SKILL_PRACTICE_MAP = {
    "docker": "If you have used Docker, add a truthful project example to your resume. Otherwise, a useful practice task is to containerize a basic REST API and write a multi-stage Dockerfile.",
    "python": "If you have Python experience, highlight specific libraries (e.g., FastAPI, Pandas). For practice, try building a web scraper or a small API endpoint to demonstrate backend skills.",
    "sql": "Mention specific databases (PostgreSQL, MySQL) and complex queries you've written. If lacking, practice by designing a schema for an e-commerce store and writing JOIN/GROUP BY queries.",
    "react": "Ensure your resume mentions specific React concepts (Hooks, Redux, Context). A good practice project is building a dashboard with state management and API integration.",
    "kubernetes": "Add examples of deployments or cluster management. As practice, try deploying a simple microservice locally using Minikube or kind.",
    "aws": "Be specific about which AWS services you used (EC2, S3, Lambda). Practice by hosting a static website on S3 with CloudFront, or deploying a serverless function.",
    "machine learning": "Specify frameworks (PyTorch, TensorFlow) and model types. Practice by participating in a Kaggle competition or building a simple classification model.",
    "javascript": "Highlight modern JS (ES6+) and frameworks used. Practice by building a vanilla JS application like a calculator or a to-do list to master the DOM.",
    "java": "Mention specific frameworks like Spring Boot. Practice by building a RESTful API using Spring Boot with a relational database.",
    "git": "If missing, ensure you mention version control. Practice by collaborating on an open-source project or creating a repository with a clear branching strategy (e.g., GitFlow).",
    "ci/cd": "Mention tools like GitHub Actions or Jenkins. Practice by setting up an automated test and build pipeline for a personal project.",
    "terraform": "Highlight Infrastructure as Code experience. For practice, try writing Terraform scripts to provision a basic AWS VPC and EC2 instance.",
    "next.js": "Showcase server-side rendering or static site generation experience. Build a blog or portfolio using Next.js App Router as practice.",
    "swift": "Mention iOS SDK experience. A great practice project is building a simple weather or to-do iOS app using SwiftUI.",
    "kotlin": "Highlight Android development experience. Practice by creating an Android app using Jetpack Compose and Coroutines.",
    "c#": "Specify if you used .NET Core or Unity. Practice by building a CRUD web API with ASP.NET Core or a basic 2D game in Unity.",
    "c++": "Showcase memory management and performance-critical development. Practice by contributing to a C++ open-source project or building a fast command-line tool.",
    "linux": "Mention specific distributions and bash scripting. Practice by setting up a Linux VM and writing bash scripts to automate daily tasks.",
    "azure": "Be specific about which Azure services you used. Practice by deploying a web app using Azure App Service and Azure SQL.",
    "gcp": "Mention specific GCP services. Practice by deploying a containerized app to Google Cloud Run.",
    "typescript": "Highlight strong typing and interfaces. Practice by migrating a small JavaScript React project to TypeScript."
}

def get_learning_advice(skill: str) -> str:
    """
    Returns specific learning advice for a given skill if available,
    otherwise returns a generic improvement suggestion.
    """
    skill_lower = skill.lower().strip()
    return SKILL_PRACTICE_MAP.get(
        skill_lower, 
        f"If you have experience with {skill}, make sure to clearly mention it in your projects or experience section. If not, consider building a small project that utilizes {skill} to bridge this gap."
    )
