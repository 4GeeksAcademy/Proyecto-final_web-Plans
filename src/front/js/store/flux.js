const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			message: null,
			demo: [
				{
					title: "FIRST",
					background: "white",
					initial: "white"
				},
				{
					title: "SECOND",
					background: "white",
					initial: "white"
				}
			],
			plans: [],
			showedPlan: {},
			planAddress: "",
			activePlans: [],
			plansHistory: [],
			categories: [],
			user: {},
			userProfile: {}

		},
		actions: {

			exampleFunction: () => {
				getActions().changeColor(0, "green");
			},

			getMessage: async () => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/api/hello");
					const data = await resp.json();
					setStore({ message: data.message });

					return data;
				} catch (error) {
					console.log("Error loading message from backend", error);
				}
			},
			changeColor: (index, color) => {
				const store = getStore();
				const demo = store.demo.map((elm, i) => {
					if (i === index) elm.background = color;
					return elm;
				});
				setStore({ demo: demo });
			},

			signup: async (name, email, password) => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/register", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email, password, name }),
					});
					if (!resp.ok) throw new Error("Error en el registro");

					const data = await resp.json();
					localStorage.setItem("token", data.token);
					localStorage.setItem("user", JSON.stringify(data.user));
					setStore({ token: data.token, user: data.user });
				} catch (error) {
					console.error("Error en el registro:", error);
					throw error;
				}
			},

			login: async (email, password) => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/login", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email, password }),
					});
					if (!resp.ok) throw new Error("Login fallido");

					const data = await resp.json();
					localStorage.setItem("token", data.token);
					localStorage.setItem("user", JSON.stringify(data.user));
					setStore({ token: data.token, user: data.user });
				} catch (error) {
					console.error("Error en el login:", error);
					throw error;
				}
			},

			logout: () => {
				localStorage.removeItem("token");
				localStorage.removeItem("user");
				setStore({ token: null, user: null });
			},

			private: async () => {
				try {
					const token = localStorage.getItem("token");
					if (!token) return false;

					const resp = await fetch(process.env.BACKEND_URL + "/private", {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token,
						},
					});
					if (!resp.ok) return false;

					const data = await resp.json();
					return true;
				} catch (error) {
					console.error("Error validando token:", error);
					return false;
				}
			},

			getPlans: async () => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/plans", {
						method: "GET",
						headers: { "Content-Type": "application/json" }
					});

					const data = await resp.json();
					setStore({ plans: data });
					const store = getStore();
					console.log("planes")
					console.log(store.plans)

				} catch (error) {
					console.error("Error trayendo planes:", error);
					return false;
				}
			},

			getCategories: async () => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/categories", {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					});
					if (!resp.ok) {
						throw new Error(`Error ${resp.status}: ${resp.statusText}`);
					}

					const data = await resp.json();
					setStore({ categories: data });
				} catch (error) {
					console.error("Error al obtener categorías:", error);
				}
			},

			createPlan: async (planData) => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token de autenticación");

					const resp = await fetch(process.env.BACKEND_URL + "/plans", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token,
						},
						body: JSON.stringify(planData),
					});

					if (!resp.ok) throw new Error("Error al crear el plan");

					const data = await resp.json();
					console.log("Plan creado:", data);
					return data;
				} catch (error) {
					console.error("Error al crear el plan:", error);
					throw error;
				}
			},

			deleteUser: async () => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token de autenticación");

					const isValidToken = await getActions().private();
					if (!isValidToken) {
						throw new Error("Token no válido o expirado");
					}

					const resp = await fetch(process.env.BACKEND_URL + "/user/profile", {
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token,
						},
					});

					if (!resp.ok) {
						const errorData = await resp.json();
						throw new Error(errorData.message || "Error al eliminar el usuario");
					}

					const data = await resp.json();
					console.log("Usuario eliminado:", data);
					localStorage.removeItem("token");
					setStore({ token: null, user: null });
					return data;
				} catch (error) {
					console.error("Error al eliminar el usuario:", error);
					throw error;
				}
			},
			getActivePlans: async () => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token disponible");

					const resp = await fetch(process.env.BACKEND_URL + "/plans/active", {
						headers: {
							"Authorization": `Bearer ${token}`
						}
					});

					if (!resp.ok) throw new Error("Error al obtener planes activos");

					const data = await resp.json();
					setStore({ activePlans: data.plans });
				} catch (error) {
					console.error("Error obteniendo planes activos:", error);
				}
			},
			saveProfile: async (profileData) => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token de autenticación");

					const resp = await fetch(process.env.BACKEND_URL + "/user/profile", {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token,
						},
						body: JSON.stringify(profileData),
					});
					if (!resp.ok) throw new Error("Error al actualizar el perfil");
					const data = await resp.json();
					console.log("Perfil actualizado:", data);
					const store = getStore();
					setStore({ userProfile: data });
					localStorage.setItem("userProfile", JSON.stringify(data));

					return data;
				} catch (error) {
					console.error("Error al actualizar el perfil:", error);
					throw error;
				}
			},

			getProfile: async () => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token de autenticación");
					const resp = await fetch(process.env.BACKEND_URL + "/user/profile", {
						headers: {
							"Authorization": `Bearer ${token}`
						}
					})
					const data = await resp.json();
					setStore({ user: data.user });
					console.log("Usuario:", data);
					return data;
				} catch (error) {
					console.error("Error al traer perfil:", error);
					throw error;
				}
			},

			joinPlan: async (planId) => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token de autenticación");
					const resp = await fetch(process.env.BACKEND_URL + `/plans/${planId}/join`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token,
						}
					});
					const data = await resp.json();

					if (!resp.ok) throw new Error(data.msg || "Error al unirse al plan");

					return data;
				} catch (error) {
					console.error("Error al unirse al plan:", error);
					throw error;
				}
			},

			setShowedPlan: (plan) => {
				setStore({ showedPlan: plan })
			},
			setPlanAddress: (address) => {
				setStore({ planAddress: address })
			},

			getPlansHistory: async () => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token disponible");
					const store = getStore();
					const activePlans = store.activePlans || [];
					const currentDate = new Date();
					for (const plan of activePlans) {
						const endDate = new Date(plan.endDate); 
						if (endDate < currentDate) {
							await fetch(`${process.env.BACKEND_URL}/plans/${plan.id}/status`, {
								method: "PUT",
								headers: {
									"Authorization": `Bearer ${token}`,
									"Content-Type": "application/json"
								},
								body: JSON.stringify({ status: "closed" }), 
							});
						}
					}
					const resp = await fetch(process.env.BACKEND_URL + "/plans/history", {
						headers: {
							"Authorization": `Bearer ${token}`
						}
					});
					if (!resp.ok) throw new Error("Error al obtener el historial de planes");
					const data = await resp.json();
					setStore({ plansHistory: data.plans });
				} catch (error) {
					console.error("Error obteniendo el historial de planes:", error);
				}
			},

			updatePlanStatus: async () => {
				try {
				  const token = localStorage.getItem("token");
				  if (!token) {
					console.error("No hay token disponible");
					return;
				  }
			  
				  const response = await fetch(`${process.env.BACKEND_URL}/update_plans_status`, {
					method: 'PUT',
					headers: {
					  'Authorization': `Bearer ${token}`,
					  'Content-Type': 'application/json',
					},
				  });
			  
				  if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.msg || "Error al actualizar el estado de los planes");
				  }
			  
				  const data = await response.json();
				  console.log(data.msg); 
				  return data; 
			  
				} catch (error) {
				  console.error("Error al actualizar el estado de los planes:", error);
				  throw error; 
				}
			  },

			deletePlan: async (planId, userId) => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token disponible");

					const store = getStore();
					const plan = store.activePlans.find(p => p.id === planId);

					if (!plan) throw new Error("Plan no encontrado");
					if (plan.creator.id !== userId) {
						throw new Error("Solo el creador puede eliminar el plan");
					}

					const resp = await fetch(`${process.env.BACKEND_URL}/plans/${planId}`, {
						method: "DELETE",
						headers: {
							"Authorization": `Bearer ${token}`
						}
					});

					if (!resp.ok) throw new Error("No se pudo eliminar el plan");

					const data = await resp.json();
					console.log("Plan eliminado:", data);

					const updatedPlans = store.activePlans.filter(plan => plan.id !== planId);
					setStore({ activePlans: updatedPlans });

				} catch (error) {
					console.error("Error al eliminar el plan:", error);
				}
			},


			leavePlan: async (planId, userName) => {
				try {
					const token = localStorage.getItem("token");
					if (!token) throw new Error("No hay token disponible");

					const store = getStore();
					const plan = store.activePlans.find(p => p.id === planId);

					if (!plan) throw new Error("Plan no encontrado");

					// Verificar si el usuario es el creador
					if (plan.creator_name === userName) {
						throw new Error("El creador no puede salir de su propio plan, solo puede eliminarlo");
					}

					const resp = await fetch(`${process.env.BACKEND_URL}/plans/${planId}/leave`, {
						method: "POST",
						headers: {
							"Authorization": `Bearer ${token}`
						}
					});

					if (!resp.ok) throw new Error("No se pudo abandonar el plan");

					const data = await resp.json();
					console.log("Has salido del plan:", data);

					const updatedPlans = store.activePlans.filter(plan => plan.id !== planId);
					setStore({ activePlans: updatedPlans });

				} catch (error) {
					console.error("Error al salir del plan:", error);
				}
			},

			initializeCategories: async () => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/initialize_categories", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
					});
					if (!resp.ok) {
						throw new Error(`Error ${resp.status}: ${resp.statusText}`);}
					const categoriesResp = await fetch(process.env.BACKEND_URL + "/categories", {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					});
					if (!categoriesResp.ok) {
						throw new Error("Error fetching categories");}
					const categoriesData = await categoriesResp.json();
					setStore({ categories: categoriesData });
					console.log("Categorías inicializadas correctamente:", categoriesData);
				} catch (error) {
					console.error("Error al inicializar categorías:", error);
				}
			},
		}
	};
};

export default getState;

