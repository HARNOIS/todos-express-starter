// Import necessary modules
var express = require('express');
var router = express.Router();
var db = require('../db');


// Function to fetch goals given a behavior plan ID
function fetchGoals(behaviorPlanId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM behavior_plan WHERE id = ?', [behaviorPlanId], (err, behaviorPlan) => {
            if (err) {
                reject(err);
            } else {
                if (behaviorPlan) {
                    const goalIds = [];
                    for (let i = 1; i <= 30; i++) {
                        const goalIdKey = `goal${i}_id`;
                        goalIds.push(behaviorPlan[goalIdKey]);
                    }
                    resolve(goalIds);
                } else {
                    reject(new Error("Behavior plan not found"));
                }
            }
        });
    });
}

// If null index is not found, then this returns -1
function findFirstNullGoalIndex(goalIds) {
    // Find the index of the first null goalId
    const index = goalIds.findIndex(id => id === null);
    // Return the index
    return index;
}


function fetchGoalById(goalId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM goal WHERE id = ?', [goalId], (err, goal) => {
            if (err) {
                reject(err);
            } else {
                resolve(goal);
            }
        });
    });
}

// This function takes the behaviorPlanId and the index where the new goal should be added. 
// It creates a new goal in the database with default values
//      then updates the behavior plan to link to this new goal at the specified index.
function createGoalAndLinkToBehaviorPlan(behaviorPlanId, index) {
    return new Promise((resolve, reject) => {
        // Insert a new goal with default values into the goal table
        db.run('INSERT INTO goal (title, description, behavior_plan_id) VALUES (?, ?, ?)',
            ["New Goal", "Default description", behaviorPlanId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    const newGoalId = this.lastID; // Get the ID of the newly created goal

                    // Update the behavior plan to add the new goal at the specified index
                    const goalFieldName = `goal${index}_id`;
                    db.run(`UPDATE behavior_plan SET ${goalFieldName} = ? WHERE id = ?`, [newGoalId, behaviorPlanId], function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(newGoalId);
                        }
                    });
                }
            });
    });
}

function getNonNullGoalIndices(goalIds) {
    const nonNullGoals = goalIds.filter(goalId => goalId !== null && goalId !== undefined);
    const indices = nonNullGoals.map((goalId, index) => [goalId, index + 1]); // Adding 1 to make indices 1-based
    return indices;
}



// POST route for behaviorPlan page
router.post('/behaviorPlan', (req, res) => {
    // Retrieve the client ID from the request body
    const clientId = req.body.clientId;

    // Now you can use the client ID to fetch the behavior plan or perform any other necessary actions

    // For example, you can query the database for the behavior plan of the specified client ID
    db.get('SELECT * FROM behavior_plan WHERE client_id = ?', [clientId], (err, behaviorPlan) => {
        if (err) {
            // Handle database error
            console.error("Error retrieving behavior plan:", err);
            res.status(500).send('Error retrieving behavior plan');
        } else {
            if (behaviorPlan) {
                // If behavior plan is found, query the database for its associated goals
                db.all('SELECT * FROM goal WHERE behavior_plan_id = ?', [behaviorPlan.id], (err, goals) => {
                    if (err) {
                        // Handle database error
                        console.error("Error retrieving goals:", err);
                        res.status(500).send('Error retrieving goals');
                    } else {
                        // Pass behavior plan and its associated goals to the behaviorPlan.ejs template
                        res.render('behaviorPlan', { user: req.user, behaviorPlan: behaviorPlan, goals: goals });
                    }
                });
            } else {
                // If behavior plan is not found, create a new one with default values
                const defaultBehaviorPlan = {
                    client_id: clientId, // Assign the client ID
                    // Add default values for other fields
                    title: "New Behavior Plan",
                    description: "Default description",
                    goal1_id: null,
                    goal2_id: null,
                    // Add default values for other goals
                };

                // Insert the new behavior plan into the database
                db.run('INSERT INTO behavior_plan (client_id, title, description, goal1_id, goal2_id) VALUES (?, ?, ?, ?, ?)', 
                    [defaultBehaviorPlan.client_id, defaultBehaviorPlan.title, defaultBehaviorPlan.description, defaultBehaviorPlan.goal1_id, defaultBehaviorPlan.goal2_id], 
                    function(err) {
                        if (err) {
                            // Handle database error
                            console.error("Error creating new behavior plan:", err);
                            res.status(500).send('Error creating new behavior plan');
                        } else {
                            // Retrieve the newly created behavior plan from the database
                            db.get('SELECT * FROM behavior_plan WHERE id = ?', [this.lastID], (err, newBehaviorPlan) => {
                                if (err) {
                                    // Handle database error
                                    console.error("Error retrieving new behavior plan:", err);
                                    res.status(500).send('Error retrieving new behavior plan');
                                } else {
                                    // Render the behaviorPlan page with the newly created behavior plan and an empty array of goals
                                    res.render('behaviorPlan', { user: req.user, behaviorPlan: newBehaviorPlan, goals: [] });
                                }
                            });
                        }
                    }
                );
            }
        }
    });
});



// POST route for adding a new goal
router.post('/goal', (req, res) => {
    // Retrieve the behavior plan ID from the request body
    const behaviorPlanId = req.body.behaviorPlanId;
    
    // Insert a new goal with default values into the goal table
    db.run('INSERT INTO goal (title, description, behavior_plan_id) VALUES (?, ?, ?)', ["New Goal", "Default description", behaviorPlanId], function(err) {
        if (err) {
            // Handle database error
            console.error("Error creating new goal:", err);
            res.status(500).send('Error creating new goal');
        } else {
            const newGoalId = this.lastID; // Get the ID of the newly created goal
            
            // Query the database for the behavior plan to get the existing goals count
            db.get('SELECT * FROM behavior_plan WHERE id = ?', [behaviorPlanId], (err, behaviorPlan) => {
                if (err) {
                    // Handle database error
                    console.error("Error retrieving behavior plan:", err);
                    res.status(500).send('Error retrieving behavior plan');
                } else {
                    if (behaviorPlan) {
                        const existingGoalCount = behaviorPlan.goalCount || 0; // If goalCount doesn't exist, default to 0
                        const newGoalPosition = existingGoalCount + 1; // Determine the position of the new goal
                        
                        // Update the behavior plan to add the new goal
                        const goalFieldName = `goal${newGoalPosition}_id`;
                        db.run(`UPDATE behavior_plan SET ${goalFieldName} = ? WHERE id = ?`, [newGoalId, behaviorPlanId], function(err) {
                            if (err) {
                                // Handle database error
                                console.error("Error updating behavior plan:", err);
                                res.status(500).send('Error updating behavior plan');
                            } else {
                                // Query the database for the newly created goal
                                db.get('SELECT * FROM goal WHERE id = ?', [newGoalId], (err, newGoal) => {
                                    if (err) {
                                        // Handle database error
                                        console.error("Error retrieving new goal:", err);
                                        res.status(500).send('Error retrieving new goal');
                                    } else {
                                        // Render the goal.ejs page with the newly created goal
                                        res.render('goal', { user: req.user, goal: newGoal });
                                    }
                                });
                            }
                        });
                    } else {
                        // If behavior plan is not found
                        res.status(404).send('Behavior plan not found');
                    }
                }
            });
        }
    });
});




// Export the router
module.exports = router;
