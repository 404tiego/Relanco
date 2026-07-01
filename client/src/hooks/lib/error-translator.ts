export function translateSupabaseError(error: any): { title: string; description: string } {
  const code = error?.code || error?.message;
  const message = error?.message || "";
  const normalizedMessage = message.toLowerCase();
  
  const errorMap: Record<string, { title: string; description: string }> = {
    "Invalid login credentials": {
      title: "Identifiants invalides",
      description: "L'email ou le mot de passe est incorrect. Veuillez réessayer."
    },
    "User already registered": {
      title: "Compte existant",
      description: "Un utilisateur est déjà inscrit avec cette adresse email."
    },
    "user_already_exists": {
      title: "Compte existant",
      description: "Un utilisateur est déjà inscrit avec cette adresse email."
    },
    "email_exists": {
      title: "Compte existant",
      description: "Un utilisateur est déjà inscrit avec cette adresse email."
    },
    "Password should be at least 6 characters": {
      title: "Mot de passe trop court",
      description: "Le mot de passe doit contenir au moins 6 caractères."
    },
    "Email not confirmed": {
      title: "Email non confirmé",
      description: "Veuillez vérifier votre boîte de réception et confirmer votre email."
    },
    "Network request failed": {
      title: "Erreur réseau",
      description: "Impossible de contacter le serveur. Vérifiez votre connexion internet."
    },
    "Too many requests": {
      title: "Trop de tentatives",
      description: "Veuillez patienter un moment avant de réessayer."
    },
    "Signup disabled": {
      title: "Inscriptions fermées",
      description: "Les nouvelles inscriptions sont temporairement désactivées."
    },
    "Rate limit exceeded": {
      title: "Limite atteinte",
      description: "Vous avez effectué trop de tentatives. Veuillez réessayer plus tard."
    },
    "User not found": {
      title: "Utilisateur introuvable",
      description: "Aucun compte n'est associé à cette adresse email."
    },
    "Invalid email": {
      title: "Email invalide",
      description: "Le format de l'adresse email n'est pas correct."
    },
    "Database error saving next challenge": {
      title: "Erreur de base de données",
      description: "Un problème est survenu lors de l'enregistrement de vos données. Veuillez réessayer."
    },
    "anonymous_provider_disabled": {
      title: "Connexion anonyme désactivée",
      description: "Les connexions anonymes ne sont pas autorisées sur cette application."
    },
    "Confirmation_token_not_found": {
      title: "Lien expiré",
      description: "Le lien de confirmation a expiré ou a déjà été utilisé."
    },
    "Provider disabled": {
      title: "Service indisponible",
      description: "La connexion via ce fournisseur (ex: Google) est actuellement désactivée."
    }
  };

  if (error?.status === 429 || error?.code === "over_query_limit") {
    return errorMap["Too many requests"];
  }

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already been registered") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("user exists") ||
    error?.code === "user_already_exists" ||
    error?.code === "email_exists"
  ) {
    return errorMap["User already registered"];
  }

  for (const key in errorMap) {
    if (message.includes(key) || error?.code === key) {
      return errorMap[key];
    }
  }

  if (normalizedMessage.includes("email")) {
    return errorMap["Invalid email"];
  }

  return {
    title: "Une erreur est survenue",
    description: message || "Une erreur inattendue s'est produite. Veuillez contacter le support si le problème persiste."
  };
}
