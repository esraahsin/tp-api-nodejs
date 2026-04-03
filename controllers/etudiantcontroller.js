// Importer le modèle Etudiant
const mongoose = require('mongoose');
const Etudiant = require('../models/Etudiant');
const { text } = require('express');
exports.createEtudiant = async (req, res) => {
  try {
    const { nom, prenom, moyenne } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({ message: 'Le nom et le prénom sont obligatoires' });
    }
    if (moyenne === undefined || typeof moyenne !== 'number') {
      return res.status(400).json({ message: 'La moyenne doit être un nombre' });
    }
    if (moyenne < 0 || moyenne > 20) {
      return res.status(400).json({ message: 'La moyenne doit être comprise entre 0 et 20' });
    }

    const etudiant = new Etudiant(req.body);
    await etudiant.save();
    res.status(201).json(etudiant);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }
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