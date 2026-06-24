type FaqItem = { question: string; answer: string };

const FAQ_BY_ROLE: Record<string, FaqItem[]> = {
  ADMIN: [
    {
      question: "Comment créer un nouvel utilisateur ?",
      answer:
        "Rendez-vous dans Administration → Utilisateurs, puis cliquez sur « Nouvel utilisateur ». Renseignez les informations, générez un mot de passe aléatoire, puis cliquez sur « Envoyer les identifiants » pour envoyer l'email de connexion à l'utilisateur.",
    },
    {
      question: "Comment confirmer un projet soumis par un Manager ?",
      answer:
        "Dans le module Projets, les projets en attente de confirmation sont identifiés par le badge « À confirmer ». Ouvrez la fiche projet et utilisez le panneau de confirmation en bas de page pour valider ou ajouter une note.",
    },
    {
      question: "Comment exporter les données ETP et temps ?",
      answer:
        "Dans Suivi ETP & Temps, filtrez la période souhaitée (semaine / mois / trimestre), puis utilisez les boutons « Exporter CSV » ou « Exporter PDF » en haut à droite. Ces exports sont réservés au rôle Administrateur.",
    },
    {
      question: "Comment gérer les rôles et les départements ?",
      answer:
        "L'organigramme (menu Organigramme) permet de créer et modifier les Départements, Sous-départements et Équipes. La matrice de permissions est accessible dans Administration → Permissions.",
    },
    {
      question: "Comment suivre toutes les actions de comité en retard ?",
      answer:
        "La page « Actions à traiter » centralise les projets à confirmer, les Week Planners soumis et les actions de comité en retard sur l'ensemble de la plateforme.",
    },
  ],
  MANAGER: [
    {
      question: "Comment valider le Week Planner de mon équipe ?",
      answer:
        "Accédez à Week Planner → Mon Équipe. Les plannings soumis par vos collaborateurs sont listés avec le statut « Soumis ». Cliquez sur un planning puis utilisez le bouton « Valider » pour le confirmer.",
    },
    {
      question: "Comment créer un comité et planifier une réunion ?",
      answer:
        "Dans le module Comités, cliquez sur « Nouveau comité », renseignez le nom, la fréquence et les participants, puis sauvegardez. Une fois le comité créé, ouvrez sa fiche et utilisez « Planifier une réunion » pour ajouter une séance.",
    },
    {
      question: "Comment suivre les objectifs de mon équipe ?",
      answer:
        "Le module Objectifs propose un onglet « Équipe » (vue Manager) où vous voyez l'ensemble des objectifs et résultats clés de vos collaborateurs, avec leur statut d'avancement.",
    },
    {
      question: "Comment créer une action décidée en réunion de comité ?",
      answer:
        "Depuis la fiche d'un comité, dépliez la réunion concernée puis cliquez sur « Ajouter une action ». Assignez un responsable, une date d'échéance et une description.",
    },
    {
      question: "Pourquoi un collaborateur ne voit-il pas ses tâches du jour ?",
      answer:
        "Les tâches quotidiennes ne sont visibles qu'après validation du Week Planner de la semaine. Si le planning n'est pas encore validé, le collaborateur verra un message l'invitant à attendre.",
    },
  ],
  COLLABORATOR: [
    {
      question: "Comment planifier ma semaine ?",
      answer:
        "Dans Week Planner, choisissez la semaine à planifier, ajoutez vos tâches par jour (projet, description, durée estimée), puis soumettez le planning à votre Manager pour validation.",
    },
    {
      question: "Comment mettre à jour mes tâches en cours de journée ?",
      answer:
        "Depuis Week Planner → Aujourd'hui, chaque tâche du jour dispose d'un bouton de mise à jour permettant d'indiquer le statut (Débuté, En cours, Terminé, Non terminé) et le temps réellement passé.",
    },
    {
      question: "Comment déclarer du temps sur un projet ?",
      answer:
        "Le temps est déclaré automatiquement lors de la mise à jour d'une tâche quotidienne. Renseignez le champ « Temps passé » (en heures) dans le panneau d'exécution de la tâche.",
    },
    {
      question: "Comment mettre à jour mes objectifs et résultats clés ?",
      answer:
        "Dans le module Objectifs, cliquez sur un objectif pour ouvrir le détail. Sur chaque résultat clé, utilisez le bouton « Mettre à jour » pour renseigner la valeur atteinte, une preuve textuelle ou un certificat.",
    },
    {
      question: "Comment réinitialiser mon mot de passe ?",
      answer:
        "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Un code à 6 chiffres valable 10 minutes vous sera envoyé par email. Saisissez ce code pour définir un nouveau mot de passe.",
    },
  ],
  INTERN: [
    {
      question: "Comment planifier ma semaine ?",
      answer:
        "Dans Week Planner, choisissez la semaine à planifier, ajoutez vos tâches par jour (projet, description, durée estimée), puis soumettez le planning à votre Manager pour validation.",
    },
    {
      question: "Comment mettre à jour mes tâches en cours de journée ?",
      answer:
        "Depuis Week Planner → Aujourd'hui, chaque tâche du jour dispose d'un bouton de mise à jour permettant d'indiquer le statut (Débuté, En cours, Terminé, Non terminé) et le temps réellement passé.",
    },
    {
      question: "Comment mettre à jour mes objectifs et résultats clés ?",
      answer:
        "Dans le module Objectifs, cliquez sur un objectif pour ouvrir le détail. Sur chaque résultat clé, utilisez le bouton « Mettre à jour » pour renseigner la valeur atteinte ou une preuve textuelle.",
    },
    {
      question: "Comment réinitialiser mon mot de passe ?",
      answer:
        "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Un code à 6 chiffres valable 10 minutes vous sera envoyé par email. Saisissez ce code pour définir un nouveau mot de passe.",
    },
  ],
};

export function FaqSection({ role }: { role: string }) {
  const items = FAQ_BY_ROLE[role] ?? FAQ_BY_ROLE.COLLABORATOR;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <details
          key={idx}
          className="group rounded-xl border border-gray200 bg-facamWhite overflow-hidden"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-facamDark select-none list-none hover:bg-gray50 transition-colors">
            <span>{item.question}</span>
            <span className="shrink-0 text-gray400 transition-transform duration-200 group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="border-t border-gray100 px-5 py-4 text-sm text-gray600 leading-relaxed">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
