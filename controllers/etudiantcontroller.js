// Importer le modèle Etudiant
const Etudiant = require('../models/Etudiant');

// ============================================
// CREATE - Créer un nouvel étudiant
// ============================================
// Route: POST /api/etudiants
// Cette fonction reçoit les données d'un étudiant dans le body
// de la requête et les enregistre dans la base de données.
exports.createEtudiant = async (req, res) => {
    try {
        // ÉTAPE NOUVELLE : Vérifier si un étudiant avec le même nom ET prénom existe déjà
        const etudiantExistant = await Etudiant.findOne({
            nom: req.body.nom,
            prenom: req.body.prenom
        });
        
        // Si un étudiant existe déjà, on refuse la création
        if (etudiantExistant) {
            return res.status(400).json({
                success: false,
                message: `Un étudiant ${req.body.prenom} ${req.body.nom} existe déjà`,
                etudiantExistant: {
                    _id: etudiantExistant._id,
                    email: etudiantExistant.email,
                    filiere: etudiantExistant.filiere
                }
            });
        }
        
        // Si tout est OK, on crée l'étudiant
        console.log('📥 Données reçues:', req.body);
        
        const etudiant = await Etudiant.create({ ...req.body, moyenne: req.body.moyenne * 2 }); // bug
        
        res.status(201).json({
            success: true,
            message: 'Étudiant créé avec succès',
            data: etudiant
        });
        
    } catch (error) {
        // Erreur de doublon (email déjà existant)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Cet email existe déjà'
            });
        }
        
        // Autres erreurs (validation, etc.)
        res.status(400).json({
            success: false,
            message: 'Données invalides',
            error: error.message
        });
    }
};

// ============================================
// READ ALL - Récupérer tous les étudiants ACTIFS
// ============================================
// Route: GET /api/etudiants
// Cette fonction retourne la liste complète des étudiants actifs.
exports.getAllEtudiants = async (req, res) => {
    try {
        // Ne récupérer que les étudiants actifs
        const etudiants = await Etudiant.find({ actif: true });
        
        res.status(200).json({
            success: true,
            count: etudiants.length,
            data: etudiants
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// READ ONE - Récupérer un étudiant par son ID
// ============================================
// Route: GET /api/etudiants/:id
// Le :id dans l'URL est un paramètre dynamique.
// Exemple: GET /api/etudiants/507f1f77bcf86cd799439011
exports.getEtudiantById = async (req, res) => {
    try {
        // Étape 1: Récupérer l'ID depuis les paramètres de l'URL
        console.log('🔍 Recherche de l\'ID:', req.params.id);
        
        // Étape 2: Chercher l'étudiant par son ID
        const etudiant = await Etudiant.findById(req.params.id);
        
        // Étape 3: Vérifier si l'étudiant existe
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }
        
        // Étape 4: Renvoyer l'étudiant trouvé
        res.status(200).json({
            success: true,
            data: etudiant
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// UPDATE - Mettre à jour un étudiant
// ============================================
// Route: PUT /api/etudiants/:id
// Cette fonction modifie les champs d'un étudiant existant.
exports.updateEtudiant = async (req, res) => {
    try {
        console.log('✏️ Mise à jour de l\'ID:', req.params.id);
        console.log('📥 Nouvelles données:', req.body);
        
        // findByIdAndUpdate prend 3 arguments:
        // 1. L'ID du document à modifier
        // 2. Les nouvelles données
        // 3. Options:
        //    - new: true = retourne le document modifié (pas l'ancien)
        //    - runValidators: true = applique les validations du schéma
        
        const etudiant = await Etudiant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        // Vérifier si l'étudiant existe
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Étudiant mis à jour avec succès',
            data: etudiant
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur de mise à jour',
            error: error.message
        });
    }
};

// ============================================
// DELETE (SOFT) - Désactiver un étudiant au lieu de le supprimer
// ============================================
// Route: DELETE /api/etudiants/:id
// Cette fonction désactive un étudiant (soft delete).
exports.deleteEtudiant = async (req, res) => {
    try {
        console.log('🗑️ Désactivation de l\'ID:', req.params.id);
        
        // Au lieu de findByIdAndDelete, on utilise findByIdAndUpdate
        // pour mettre actif: false
        const etudiant = await Etudiant.findByIdAndUpdate(
            req.params.id,
            { actif: false },  // ← On désactive au lieu de supprimer
            { new: true }      // Retourne le document modifié
        );
        
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Étudiant désactivé avec succès',
            data: etudiant
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// SEARCH - Rechercher des étudiants par filière
// ============================================
// Route: GET /api/etudiants/filiere/:filiere
// Exemple: GET /api/etudiants/filiere/Informatique
exports.getEtudiantsByFiliere = async (req, res) => {
    try {
        console.log('🔎 Recherche par filière:', req.params.filiere);
        
        // Chercher tous les étudiants avec cette filière
        const etudiants = await Etudiant.find({ filiere: req.params.filiere });
        
        res.status(200).json({
            success: true,
            count: etudiants.length,
            filiere: req.params.filiere,
            data: etudiants
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// SEARCH - Rechercher des étudiants par nom ou prénom
// ============================================
// Route: GET /api/etudiants/search?q=ahmed
// Le paramètre 'q' est récupéré depuis req.query.q
exports.searchEtudiants = async (req, res) => {
    try {
        // Étape 1 : Récupérer le terme de recherche depuis l'URL
        const searchTerm = req.query.q;
        
        console.log('🔎 Recherche pour:', searchTerm);
        
        // Vérifier que le paramètre 'q' existe
        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: 'Paramètre de recherche manquant. Utilisez ?q=terme'
            });
        }
        
        // Étape 2 : Créer une expression régulière (regex) pour recherche insensible à la casse
        // 'i' = insensible à la casse (Ahmed = ahmed = AHMED)
        const regex = new RegExp(searchTerm, 'i');
        
        // Étape 3 : Chercher dans le nom OU le prénom
        // $or = opérateur MongoDB pour "OU logique"
        const etudiants = await Etudiant.find({
            $or: [
                { nom: regex },      // Cherche dans le nom
                { prenom: regex }    // OU dans le prénom
            ]
        });
        
        // Étape 4 : Renvoyer les résultats
        res.status(200).json({
            success: true,
            searchTerm: searchTerm,
            count: etudiants.length,
            data: etudiants
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// READ INACTIVE - Voir les étudiants désactivés
// ============================================
// Route: GET /api/etudiants/inactifs
exports.getEtudiantsInactifs = async (req, res) => {
    try {
        console.log('👻 Récupération des étudiants inactifs');
        
        // Chercher les étudiants avec actif: false
        const etudiants = await Etudiant.find({ actif: false });
        
        res.status(200).json({
            success: true,
            count: etudiants.length,
            message: 'Liste des étudiants désactivés',
            data: etudiants
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// RESTORE - Réactiver un étudiant désactivé
// ============================================
// Route: PATCH /api/etudiants/:id/restore
exports.restoreEtudiant = async (req, res) => {
    try {
        console.log('♻️ Réactivation de l\'ID:', req.params.id);
        
        const etudiant = await Etudiant.findByIdAndUpdate(
            req.params.id,
            { actif: true },  // ← On réactive
            { new: true }
        );
        
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Étudiant réactivé avec succès',
            data: etudiant
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// HARD DELETE - Supprimer définitivement un étudiant
// ============================================
// Route: DELETE /api/etudiants/:id/permanent
// ⚠️ Attention : Cette action est irréversible !
exports.hardDeleteEtudiant = async (req, res) => {
    try {
        console.log('💀 Suppression DÉFINITIVE de l\'ID:', req.params.id);
        
        const etudiant = await Etudiant.findByIdAndDelete(req.params.id);
        
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Étudiant supprimé définitivement',
            data: {}
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};
// Recherche avancée avec filtres multiples
exports.advancedSearch = async (req, res) => {
    try {
        const { nom, filiere, anneeMin, anneeMax, moyenneMin } = req.query;
        let filter = { actif: true };

        if (nom) filter.nom = new RegExp(nom, 'i');
        if (filiere) filter.filiere = filiere;
        if (anneeMin || anneeMax) {
            filter.annee = {};
            if (anneeMin) filter.annee.$gte = parseInt(anneeMin);
            if (anneeMax) filter.annee.$lte = parseInt(anneeMax);
        }
        if (moyenneMin) filter.moyenne = { $gte: parseFloat(moyenneMin) };

        const etudiants = await Etudiant.find(filter);

        res.status(200).json({
            success: true,
            count: etudiants.length,
            filters: req.query,
            data: etudiants
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};