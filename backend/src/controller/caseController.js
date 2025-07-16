/**
 *   CASE CONTROLLER
 *        > handles creating, editing, and terminating of case
 */

const mongoose = require('mongoose');
const Family_Relationship = require('../model/family_relationship');
const Sponsored_Member = require('../model/sponsored_member')
const Family_Member = require('../model/family_member')
const Employee = require('../model/employee');

const [caseSchemaValidate, caseCoreValidate, caseIdentifyingValidate] = require('./validators/caseValidator')

// ================================================== //

/**
 * @route   GET /api/cases/:id
 * @desc    Retrieves a Sponsored Member case by its ObjectId, including its related family members
 * 
 * @required
 *    - :id URL parameter: ObjectId of the Sponsored Member case to retrieve
 * 
 * @notes
 *    - Validates if the provided id is a valid Mongo ObjectId
 *    - Fetches the case by its _id
 *    - Looks up all family relationships for the given case via sponsor_id
 *    - For each family relationship, retrieves the corresponding family member details by family_id
 *    - Combines each family member’s info with their relationship_to_sm
 * 
 * @returns
 *    - 200 OK: case data with its family members (even if none found)
 *    - 400 Bad Request: if the provided id is invalid
 *    - 500 Internal Server Error: if something goes wrong during the process
 */

// const getCaseById = async (req, res) => {
//      //for now lets do static but replace with req.params.id

//      //checks if its a valid ObjectId
//      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//           return res.status(400).json({ message: 'Invalid case' });
//      }
//      const id = req.params.id;

//      try {
//           //finds an id in our mongo
//           const caseItem = await Sponsored_Member.findById(id).lean().populate(
//                'assigned_sdw'
//           );
//           res.json(caseItem);
//      } catch (error) {

//           console.error('Error fetching cases:', error);
//           res.status(500).json({
//                message: 'Error retrieving case data',
//                error: error.message
//           });
//      }
// };

const getCaseById = async (req, res) => {
     const id = req.params.id;

     try {
          //finds an id in our mongo
          const caseItem = await Sponsored_Member.findById(id).lean().populate(
               'assigned_sdw'
          );
          res.json(caseItem);
     } catch (error) {

          console.error('Error fetching cases:', error);
          res.status(500).json({
               message: 'Error retrieving case data',
               error: error.message
          });
     }
};

const getCaseBySMNumber = async (req, res) => {
     const smNumber = req.params.sm_number;

     console.log('[getCaseBySMNumber] Called with SM Number:', smNumber);

     try {
          const caseItem = await Sponsored_Member.findOne({ sm_number: smNumber })
               .populate('assigned_sdw')
               .lean();

          console.log('[getCaseBySMNumber] Found:', caseItem);

          if (!caseItem) {
               return res.status(200).json({
                    found: false,
                    message: 'Case not found for given SM Number',
               });
          }

          res.status(200).json({
               found: true,
               data: caseItem,
          });
     } catch (error) {
          console.error('[getCaseBySMNumber] Error:', error);
          res.status(500).json({ message: 'Error fetching case', error: error.message });
     }
};


const getAllSDWs = async (req, res) => {
     try {
          console.log('Fetching all employees...');
          const employees = await Employee.find();
          //console.log('Employees found:', employees);
          res.json(employees);
     } catch (error) {
          console.error('Failed to fetch employees:', error);
          res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
     }
};


/**  
 *   Gets all cases that are viable to be seen based on user priveleges
 */
const getAllCaseViable = async (req, res) => {
     const userPriv = req.userId;
     try {
          const cases = await Sponsored_Member.find({
               assigned_sdw: userPriv,
               isActive: "true"
          })

               .lean();

          res.json(cases);
     } catch (error) {
          console.error('Error fetching cases:', error);
          res.status(500).json({
               message: 'Error retrieving case data',
               error: error.message
          });
     }
}
/**  
 *   Gets all cases of social development worker
 *   returns name of sponsored member and id only
 */
const getAllCasesbySDW = async (req, res) => {
     const sdwId = req.params.sdwID;
     if (!mongoose.Types.ObjectId.isValid(sdwId)) {
          return res.status(400).json({ message: "Invalid Social Development Worker Id" });
     }
     try {
          const allCases = await Sponsored_Member.find({
               is_active: true,
               assigned_sdw: sdwId
          })
               .populate('assigned_sdw')
               .lean()

          const simplifiedCases = allCases.map(c => ({
               id: c._id,
               name: `${c.first_name} ${c.middle_name || ''} ${c.last_name}`,
               sm_number: c.sm_number,
               spu: c.spu,
               is_active: c.is_active,
               assigned_sdw: c.assigned_sdw._id,
               assigned_sdw_name: c.assigned_sdw
                    ? `${c.assigned_sdw.first_name} ${c.assigned_sdw.middle_name || ''} ${c.assigned_sdw.last_name}`.trim()
                    : null
          }));

          res.status(200).json(simplifiedCases);

     } catch (error) {
          console.error("Error fetching Cases for SDW: ", error);
          res.status(500).json({
               message: "Error fetching Cases for SDW",
               error: error.message
          })
     }

}
/**  
 *   Gets all cases returns name and id only
 */
const getAllCases = async (req, res) => {
     try {
          const cases = await Sponsored_Member.find({})
               .populate('assigned_sdw', 'first_name middle_name last_name') // Only fetch name fields
               .lean();

          const simplifiedCases = cases.map(c => ({
               id: c._id,
               name: `${c.first_name} ${c.middle_name || ''} ${c.last_name}`,
               sm_number: c.sm_number,
               spu: c.spu,
               is_active: c.is_active,
               assigned_sdw: c.assigned_sdw?._id || null,
               assigned_sdw_name: c.assigned_sdw
                    ? `${c.assigned_sdw.first_name} ${c.assigned_sdw.middle_name || ''} ${c.assigned_sdw.last_name}`.trim()
                    : null
          }));

          res.json(simplifiedCases);
     } catch (error) {
          console.error('Error fetching cases:', error);
          res.status(500).json({
               message: 'Error retrieving case data',
               error: error.message
          });
     }
};

/**
 * @route   POST /api/cases/reassign-sdw
 * @desc    Assigns a Social Development Worker (SDW) to an existing Sponsored Member case
 * 
 * @required
 *    - caseId: ObjectId of the Sponsored Member case to update
 *    - assigned_sdw: ObjectId of the Employee to assign as SDW
 * 
 * @notes
 *    - Both caseId and assigned_sdw must be valid Mongo ObjectIds
 *    - The request should use Content-Type: application/json
 *    - Populates the assigned_sdw field to return full Employee details in the response
 * 
 * @returns
 *    - 200 OK: if SDW assignment is successful
 *    - 400 Bad Request: if caseId or assigned_sdw is invalid
 *    - 404 Not Found: if the case is not found
 *    - 500 Internal Server Error: if something else goes wrong
 */

const reassignSDW = async (req, res) => {
     //this gets the case and also the assigned_sdw ids
     const { caseId, assigned_sdw } = req.body;
     if (!mongoose.Types.ObjectId.isValid(caseId) || !mongoose.Types.ObjectId.isValid(assigned_sdw)) {
          return res.status(400).json({ message: 'Invalid case or sdw' });
     }

     try {
          const updatedCase = await Sponsored_Member.findByIdAndUpdate(
               caseId,
               { assigned_sdw },
               { new: true }
          ).populate('assigned_sdw')
               .lean()
          if (!updatedCase) {
               return res.status(404).json({ message: "Case not found xD" });
          }
          res.status(200).json(
               {
                    message: "SDW Assigned Succsefully",
                    updatedCase
               }
          );


     } catch (error) {
          console.error('Error assigning SDW:', error);
          res.status(500).json({ message: 'Error assigning SDW', error });
     }

}

/**
 * @route   POST /api/case/case-create(note this can change )
 * @desc    Adds a new Sponsored Member case
 * 
 * @required
 *    - last_name
 *    - first_name
 *    - sex
 *    - present_address
 *    - dob
 *    - pob
 *    - civil_status
 *    - problem_presented
 *    - is_active
 *    - assigned_sdw: valid Employee ObjectId
 * 
 * @notes
 *    - sm_number is auto-generated (no need to pass)
 *    - use application/json for request body
 *    - interventions optional (array of ObjectIds)
 */

const addNewCase = async (req, res) => {
     const newCaseData = req.body;
     const sdwId = req.session?.user?._id;
     const spu_id = req.session?.user?.spu_id;

     if (!newCaseData) {
          return res.status(400).json({ message: 'Invalid case' });
     }
     if (!mongoose.Types.ObjectId.isValid(sdwId)) {
          return res.status(400).json({ message: 'Invalid SDW' });
     }

     try {
          // First validate the raw data with our assigned_sdw
          const dataToValidate = {
               ...newCaseData,// Convert ObjectId to string for validation
          };

          // Validate BEFORE creating the Mongoose model
          const { error } = caseSchemaValidate.validate(dataToValidate);
          if (error) {
               return res.status(400).json({
                    message: 'Validation error',
                    details: error.details.map(detail => detail.message)
               });
          }

          // Only create the Mongoose model after validation passes
          const caseToSave = {
               ...newCaseData,
               assigned_sdw: sdwId,
               spu_id: spu_id
          };

          const newCase = new Sponsored_Member(caseToSave);
          const savedCase = await newCase.save();

          res.status(201).json({
               message: 'New case created successfully',
               case: savedCase
          });
     } catch (error) {
          console.error('Error creating new case:', error);
          res.status(500).json({ message: 'Failed to create case', error });
     }
}

/**
 * @route   PUT /api/cases/edit/:id
 * @desc    Updates a Sponsored Member case by ID
 * 
 * @required
 *    - :id parameter: ObjectId of the case to update
 *    - Request body: Updated case data
 * 
 * @returns
 *    - 200 OK: Updated case data
 *    - 400 Bad Request: Invalid ID or validation error
 *    - 404 Not Found: Case not found
 *    - 500 Internal Server Error: Server error
 */
const editCaseCore = async (req, res) => {
     const updatedCaseData = req.body;
     const caseId = req.params.id;

     if (!mongoose.Types.ObjectId.isValid(caseId)) {
          return res.status(400).json({ message: 'Invalid case ID format' });
     }

     try {
          // First get the existing case
          const existingCase = await Sponsored_Member.findById(caseId);
          if (!existingCase) {
               return res.status(404).json({ message: 'Case not found' });
          }

          // Merge existing data with updates for validation
          const mergedData = {
               ...existingCase.toObject(),
               ...updatedCaseData
          };

          // Validate the merged data
          const { error } = caseCoreValidate.validate(updatedCaseData);
          if (error) {
               return res.status(400).json({
                    message: 'Validation error',
                    details: error.details.map(detail => detail.message)
               });
          }

          // Update with only the fields provided
          const updatedCase = await Sponsored_Member.findByIdAndUpdate(
               caseId,
               updatedCaseData,
               { new: true }
          ).lean();

          res.status(200).json({
               message: 'Case updated successfully',
               case: updatedCase
          });
     } catch (error) {
          console.error('Error updating case:', error);
          res.status(500).json({
               message: 'Failed to update case',
               error: error.message
          });
     }
}

const editCaseIdentifyingData = async (req, res) => {
     const updatedCaseData = req.body;
     const caseId = req.params.id;

     if (!mongoose.Types.ObjectId.isValid(caseId)) {
          return res.status(400).json({ message: 'Invalid case ID format' });
     }

     try {
          // First get the existing case
          const existingCase = await Sponsored_Member.findById(caseId);
          if (!existingCase) {
               return res.status(404).json({ message: 'Case not found' });
          }

          // Merge existing data with updates for validation
          const mergedData = {
               ...existingCase.toObject(),
               ...updatedCaseData
          };

          // Validate the merged data
          const { error } = caseIdentifyingValidate.validate(updatedCaseData);
          if (error) {
               return res.status(400).json({
                    message: 'Validation error',
                    details: error.details.map(detail => detail.message)
               });
          }

          // Update with only the fields provided
          const updatedCase = await Sponsored_Member.findByIdAndUpdate(
               caseId,
               updatedCaseData,
               { new: true }
          ).lean();

          res.status(200).json({
               message: 'Case updated successfully',
               case: updatedCase
          });
     } catch (error) {
          console.error('Error updating case:', error);
          res.status(500).json({
               message: 'Failed to update case',
               error: error.message
          });
     }
}


const archiveCase = async (req, res) => {
     const caseId = req.params.sdwID; // Fixed: params not param
     if (!mongoose.Types.ObjectId.isValid(caseId)) {
          return res.status(400).json({ message: 'Invalid case ID format' });
     }

     try {
          // Validate the updated data
          /*
          const { error } = caseSchemaValidate.validate(updatedCaseData);
          if (error) {
              return res.status(400).json({
                  message: 'Validation error',
                  details: error.details.map(detail => detail.message)
              });
          }
          */
          // Update the case
          const updatedCase = await Sponsored_Member.findByIdAndUpdate(
               caseId,
               { isAlive: false },
               { new: true } // Return the updated document
          ).lean();

          if (!updatedCase) {
               return res.status(404).json({ message: 'Case not found' });
          }

          res.status(200).json({
               message: 'Case updated successfully',
               case: updatedCase
          });
     } catch (error) {
          console.error('Error updating case:', error);
          res.status(500).json({
               message: 'Failed to update case',
               error: error.message
          });
     }
}

/**  
 *   Gets the family member/s
 */
const getFamilyMembers = async (req, res) => {
     try {
          const caseSelected = req.params.caseID;

          // Match family IDs and relationship to client
          const relationships = await Family_Relationship.find({ sponsor_id: caseSelected });
          const familyData = relationships.map(rel => ({
               id: rel.family_id._id.toString(),
               relationship_to_sm: rel.relationship_to_sm
          }));
          const familyMembers = await Family_Member.find({
               _id: { $in: familyData.map(fam => fam.id) }
          });
          const FamilyRelationshipMap = familyMembers.map(member => {
               const rel = familyData.find(fam => fam.id === member._id.toString());
               return {
                    ...member.toObject(),
                    relationship_to_sm: rel.relationship_to_sm
               };
          });

          // Transform so it would match the HTML variables
          const formattedFamilyMembers = FamilyRelationshipMap.map((member) => ({
               id: member._id.toString(),

               first: member.first_name || '',
               middle: member.middle_name || '',
               last: member.last_name || '',
               name: fullname_Formatter(member) || '',

               age: member.age || '',
               income: member.income || '',
               civilStatus: member.civil_status || '',
               occupation: member.occupation || '',
               education: member.edu_attainment || '',
               relationship: member.relationship_to_sm || '',

               status: member.status || ""
          }));

          // Return response
          res.status(200).json(formattedFamilyMembers);
     } catch (error) {
          console.error('Error fetching:', error);
          res.status(500).json({
               message: 'Error retrieving family composition',
               error: error.message
          });
     }
}

/**  
 *   Adds a family member
 */
const addFamilyMember = async (req, res) => {
     try {
          const caseSelected = await Sponsored_Member.findById(req.params.caseID);
          const updateDetails = req.body;

          // console.log(updateDetails)

          for (const [key, value] of Object.entries(updateDetails)) {
               if (key === "middle" || key === "income" || key === "name" || key === "id") continue;

               if (value === null || value === undefined || value === "") {
                    console.log("Empty field found.")
                    return res.status(200).json("Empty field found.");
               }
          }

          if (updateDetails.income < 0)
               updateDetails.income = 0

          if (parseInt(updateDetails.age) == 0)
               updateDetails.age = 0
          else if (!parseInt(updateDetails.age))
               updateDetails.age = 0
          else if (parseInt(updateDetails.age) < 0)
               updateDetails.age = 0

          const newMember = new Family_Member({
               first_name: updateDetails.first,
               middle_name: updateDetails.middle || "",
               last_name: updateDetails.last,
               age: parseInt(updateDetails.age),
               income: updateDetails.income || 0,
               civil_status: updateDetails.civilStatus,
               occupation: updateDetails.occupation,
               edu_attainment: updateDetails.education,
               status: updateDetails.status
          })
          // console.log(newMember);
          await newMember.validate();

          const newRelationship = new Family_Relationship({
               family_id: newMember._id,
               sponsor_id: caseSelected._id,
               relationship_to_sm: updateDetails.relationship
          });
          // console.log(newRelationship)
          await newRelationship.validate();

          await newMember.save();
          await newRelationship.save();

          // Format the return data again
          const returnData = {
               id: newMember._id.toString(),

               first: newMember.first_name,
               middle: newMember.middle_name || '',
               last: newMember.last_name,
               name: fullname_Formatter(newMember),

               age: newMember.age,
               income: newMember.income,
               civilStatus: newMember.civil_status,
               occupation: newMember.occupation,
               education: newMember.edu_attainment,
               relationship: updateDetails.relationship,
               status: newMember.status,

               deceased: newMember.status === "Deceased"
          }
          // console.log(returnData);

          // Response
          res.status(200).json(returnData);
     } catch (error) {
          console.error("Error adding family member:", error);
          res.status(500).json({ message: "Internal Server Error" });
     }
}

/**  
 *   Deletes a family member
 */
const deleteFamilyMember = async (req, res) => {
     try {
          const familySelected = await Family_Member.findById(req.params.famID);
          const caseSelected = await Sponsored_Member.findById(req.params.caseID);

          // console.log("delete")

          if (!familySelected || !caseSelected) {
               return res.status(400).json({ message: `Cannot proceed action, missing IDs.` });
          }

          await Family_Relationship.deleteOne({
               family_id: familySelected,
               sponsor_id: caseSelected
          })

          var flag = await Family_Relationship.findOne({ family_id: familySelected })
          if (!flag) {
               await Family_Member.deleteOne({
                    _id: familySelected
               })
          }

          return getFamilyMembers(req, res);
     } catch (error) {
          console.error("Error deleting family member:", error);
          res.status(500).json({ message: "Internal Server Error" });
     }
}

/**  
 *   Edits a chosen family member
 */
const editFamilyMember = async (req, res) => {
     try {
          const updateDetails = req.body;

          const familySelected = await Family_Member.findById(req.params.famID);
          const caseSelected = await Sponsored_Member.findById(req.params.caseID);
          const relationshipSelected = await Family_Relationship.findOne({
               family_id: familySelected,
               sponsor_id: caseSelected
          })

          if (!familySelected || !caseSelected || !relationshipSelected)
               throw error;

          // var status = "Living"
          // if (updateDetails.deceased)
          //      status = "Deceased"

          if (updateDetails.income < 0)
               updateDetails.income = familySelected.income

          if (parseInt(updateDetails.age) == 0)
               updateDetails.age = 0
          else if (!parseInt(updateDetails.age))
               updateDetails.age = familySelected.age
          else if (parseInt(updateDetails.age) < 0)
               updateDetails.age = familySelected.age

          /**
           *   Updating part
           * 
           *   In case that the updateDetails is an empty string, the default value is retrieved
           */
          const updatedData = {
               first_name: updateDetails.first || familySelected.first_name,
               middle_name: updateDetails.middle || "",
               last_name: updateDetails.last || familySelected.last_name,

               age: updateDetails.age !== undefined && updateDetails.age !== ""
                    ? parseInt(updateDetails.age)
                    : familySelected.age,

               income: updateDetails.income || 0,
               civil_status: updateDetails.civilStatus || familySelected.civil_status,
               occupation: updateDetails.occupation || familySelected.occupation,
               edu_attainment: updateDetails.education || familySelected.edu_attainment,
               status: updateDetails.status || familySelected.status,
          };
          const updatedFam = await Family_Member.findByIdAndUpdate(familySelected._id, updatedData, { new: true });

          const updatedRel = await Family_Relationship.findByIdAndUpdate(
               relationshipSelected._id,
               { $set: { relationship_to_sm: updateDetails.relationship || relationshipSelected.relationship_to_sm } },
               { new: true }
          );

          // Format the return data again
          const returnData = {
               id: updatedFam._id,

               first: updatedFam.first_name,
               middle: updatedFam.middle_name,
               last: updatedFam.last_name,
               name: fullname_Formatter(updatedFam),

               age: updatedFam.age,
               income: updatedFam.income,
               civilStatus: updatedFam.civil_status,
               occupation: updatedFam.occupation,
               education: updatedFam.edu_attainment,
               relationship: updatedRel.relationship_to_sm,

               status: updatedFam.status,

               deceased: updatedFam.status === "Deceased"
          }

          // Response
          res.status(200).json(returnData);
     } catch (error) {
          console.error("Error updating family member:", error);
          res.status(500).json({ message: "Internal Server Error" });
     }
}

/**
 *   Edits a case's problems and findings
 */

// MODIFIED
const editProblemsAndFindings = async (req, res) => {
     try {
          const caseToUpdate = await Sponsored_Member.findById(req.params.caseID)
          const updateDetails = req.body;

          // Validate required fields
          if (!caseToUpdate) {
               return res.status(400).json({
                    message: 'Cannot find case'
               });
          }

          // Update problems and findings
          caseToUpdate.problem_presented = updateDetails.problem_presented || '';
          caseToUpdate.history_problem = updateDetails.history_problem || '';
          caseToUpdate.observation_findings = updateDetails.observation_findings || '';

          // Save the updated case
          await caseToUpdate.save();

          // Return success response
          return res.status(200).json({
               message: 'Problems and findings updated successfully',
               case: caseToUpdate
          });
     } catch (error) {
          console.error('Error editing problems and findings:', error);
          return res.status(500).json({
               message: 'Error editing problems and findings',
               error: error.message
          });
     }
}

/**  
 *   Edits a case's assessment
 */
const editAssessment = async (req, res) => {
     try {
          const caseToUpdate = await Sponsored_Member.findById(req.params.caseID)
          const updateDetails = req.body;

          // Validate require fields
          if (!caseToUpdate) {
               return res.status(400).json({
                    message: 'Cannot find case'
               });
          }

          // Update assessment
          caseToUpdate.assessment = updateDetails.assessment || '';
          await caseToUpdate.save();

          // Return success response
          return res.status(200).json({
               message: 'Assessment updated successfully',
               case: caseToUpdate
          });
     } catch (error) {
          console.error('Error editing assessment:', error);
          return res.status(500).json({
               message: 'Error editing assessment',
               error: error.message
          });
     }
}

/**  
 *   Edits a case's evaluation and recommendation
 */
const editEvaluationAndRecommendation = async (req, res) => {
     try {
          const caseToUpdate = await Sponsored_Member.findById(req.params.caseID)
          const updateDetails = req.body;
          // Validate required fields
          if (!caseToUpdate) {
               return res.status(400).json({
                    message: 'Cannot find case'
               });
          }

          // Update evaluation and recommendation
          caseToUpdate.evaluation = updateDetails.evaluation || '';
          caseToUpdate.recommendation = updateDetails.recommendation || '';
          await caseToUpdate.save();

          // Return success response
          return res.status(200).json({
               message: 'Evaluation and recommendation updated successfully',
               case: caseToUpdate
          });
     } catch (error) {
          console.error('Error editing evaluation and recommendation:', error);
          return res.status(500).json({
               message: 'Error editing evaluation and recommendation',
               error: error.message
          });
     }
}

/**  
 *   Creates a new intervention
 */
const addIntervention = async (req, res) => {
     // code here
}

// ================================================== //

/**
 *   Formats full names
 *   @param {*} member : Object to be updated
 *   @returns : The formatted full name
 */
function fullname_Formatter(member) {
     const first = member.first_name || '';
     const middle = member.middle_name ? ` ${member.middle_name}` : '';
     const last = member.last_name || '';

     return `${first}${middle} ${last}`.trim();
}

// ================================================== //

module.exports = {
     getCaseById,
     getCaseBySMNumber,
     getFamilyMembers,
     editFamilyMember,
     deleteFamilyMember,
     addFamilyMember,
     getAllCases,
     getAllCaseViable,
     reassignSDW,
     addNewCase,
     editProblemsAndFindings,
     editAssessment,
     editEvaluationAndRecommendation,
     editCaseCore,
     editCaseIdentifyingData,
     getAllSDWs,
     getAllCasesbySDW,
}