import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";

const RiceContext = createContext();
// 动态配置后端 API 基地址，支持开发和生产环境
const getApiBase = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
  // 在开发环境中直接连接到后端API，避免代理问题
  return "http://localhost:3001";
};

const API_BASE = getApiBase();

export const RiceProvider = ({ children }) => {
  const [riceScore, setRiceScore] = useState(0); // Initial rice score
  const [projects, setProjects] = useState([]);
  const [consumables, setConsumables] = useState([]);
  const [purchaseRecords, setPurchaseRecords] = useState([]);
  const isRequestingRef = useRef(false);

  // 数据缓存，减少重复请求
  const dataCache = useRef({
    lastFetch: 0,
    cacheDuration: 5000, // 减少到5秒缓存，提高刷新速度
    data: null,
  });

  // Ref to track current state for use in fetchAll
  const currentStateRef = useRef({
    riceScore,
    projects,
    consumables,
    purchaseRecords,
  });

  // Update ref whenever state changes
  useEffect(() => {
    currentStateRef.current = {
      riceScore,
      projects,
      consumables,
      purchaseRecords,
    };
  }, [riceScore, projects, consumables, purchaseRecords]);
  const justCompletedRequestRef = useRef(false);

  const updateIsRequesting = (value) => {
    isRequestingRef.current = value;
    if (!value) {
      // 设置标志表示请求刚完成
      justCompletedRequestRef.current = true;
    }
  };

  // 节流相关状态
  const lastFetchTime = useRef(0);
  const FETCH_THROTTLE_MS = 2000; // 减少到2秒的节流时间，提高响应速度

  // 简化的fetch函数实现
  const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
    // 基本的fetch选项
    const fetchOptions = {
      ...options,
      // 简单的CORS配置
      mode: "cors",
      credentials: "include",
      headers: {
        ...options.headers,
      },
    };

    // 不使用AbortController，避免ERR_ABORTED错误
    try {
      // 直接使用fetch，不添加额外的超时Promise.race
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}, url: ${url}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };

  const fetchAll = useCallback(async () => {
    // Only fetch data if no API request is in progress
    if (isRequestingRef.current) return;

    // 检查是否刚完成请求，如果是则跳过这次fetch
    if (justCompletedRequestRef.current) {
      // 重置标志
      justCompletedRequestRef.current = false;
      return;
    }

    const now = Date.now();

    // 检查缓存是否有效
    if (
      dataCache.current.data &&
      now - dataCache.current.lastFetch < dataCache.current.cacheDuration
    ) {
      console.log("Using cached data");
      const cachedData = dataCache.current.data;

      // 使用缓存数据更新状态
      setRiceScore(Number(cachedData.riceScore) || 0);
      setProjects(cachedData.projects || []);
      setConsumables(cachedData.consumables || []);
      setPurchaseRecords(cachedData.purchaseRecords || []);
      return;
    }

    // 检查是否在合理的时间间隔内（避免频繁请求）
    if (now - lastFetchTime.current < FETCH_THROTTLE_MS) {
      return;
    }

    lastFetchTime.current = now;

    let retries = 0;
    const maxRetries = 2;
    const url = `${API_BASE}/api/data`;

    console.log(`Attempting to fetch data from ${url}`);

    while (retries <= maxRetries) {
      try {
        // 使用简单的fetch而不是fetchWithTimeout，直接测试API连接
        console.log(`Fetch attempt ${retries + 1}/${maxRetries + 1}`);
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
          credentials: "include",
        });

        console.log(`Fetch response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetch successful, checking if data changed");

        // Get current state from ref
        const currentState = currentStateRef.current;

        // Only update state if data actually changed
        const newRiceScore = Number(data.riceScore);
        const validRiceScore = Number.isFinite(newRiceScore) ? newRiceScore : 0;
        if (validRiceScore !== currentState.riceScore) {
          setRiceScore(validRiceScore);
        }

        const newProjects = data.projects || [];
        // Compare projects without considering order
        const areProjectsSame = () => {
          if (newProjects.length !== currentState.projects.length) return false;
          const currentProjectMap = new Map(
            currentState.projects.map((p) => [p.id, p])
          );
          for (const newProject of newProjects) {
            const currentProject = currentProjectMap.get(newProject.id);
            if (
              !currentProject ||
              JSON.stringify(newProject) !== JSON.stringify(currentProject)
            ) {
              return false;
            }
          }
          return true;
        };
        if (!areProjectsSame()) {
          setProjects(newProjects);
        }

        const newConsumables = data.consumables || [];
        // Compare consumables without considering order
        const areConsumablesSame = () => {
          if (newConsumables.length !== currentState.consumables.length)
            return false;
          const currentConsumableMap = new Map(
            currentState.consumables.map((c) => [c.id, c])
          );
          for (const newConsumable of newConsumables) {
            const currentConsumable = currentConsumableMap.get(
              newConsumable.id
            );
            if (
              !currentConsumable ||
              JSON.stringify(newConsumable) !==
              JSON.stringify(currentConsumable)
            ) {
              return false;
            }
          }
          return true;
        };
        if (!areConsumablesSame()) {
          setConsumables(newConsumables);
        }

        const newPurchaseRecords = data.purchaseRecords || [];
        // Compare purchase records without considering order
        const areRecordsSame = () => {
          if (newPurchaseRecords.length !== currentState.purchaseRecords.length)
            return false;
          const currentRecordMap = new Map(
            currentState.purchaseRecords.map((r) => [r.id, r])
          );
          for (const newRecord of newPurchaseRecords) {
            const currentRecord = currentRecordMap.get(newRecord.id);
            if (
              !currentRecord ||
              JSON.stringify(newRecord) !== JSON.stringify(currentRecord)
            ) {
              return false;
            }
          }
          return true;
        };
        if (!areRecordsSame()) {
          setPurchaseRecords(newPurchaseRecords);
        }

        // 更新缓存
        dataCache.current = {
          lastFetch: now,
          cacheDuration: 30000,
          data: data,
        };

        break; // 成功后退出循环
      } catch (error) {
        console.error(
          `Failed to fetch data (attempt ${retries + 1}/${maxRetries + 1}):`,
          error
        );
        retries++;
        if (retries > maxRetries) {
          // 所有重试都失败了
          console.error("All fetch attempts failed");
        } else {
          // 重试前等待一段时间
          const delay = 1000 * retries;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 直接调用fetchAll，内部已经有节流控制
        fetchAll();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchAll]);

  const addRice = (amount) => {
    setRiceScore((prevScore) => prevScore + amount);
  };

  const consumeRice = (amount) => {
    if (riceScore >= amount) {
      setRiceScore((prevScore) => prevScore - amount);
      return true;
    } else {
      alert("无米粒"); // Or use a more sophisticated toast notification
      return false;
    }
  };

  const addProject = async (newProjectData) => {
    let retries = 0;
    const maxRetries = 2;

    try {
      updateIsRequesting(true);

      while (retries <= maxRetries) {
        try {
          const newProject = await fetchWithTimeout(
            `${API_BASE}/api/data/projects`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(newProjectData),
            }
          );

          // Update local state directly instead of calling fetchAll
          setProjects((prev) => [...prev, newProject]);
          break;
        } catch (error) {
          console.error(
            `Failed to add project (attempt ${retries + 1}/${maxRetries + 1}):`,
            error
          );
          retries++;
          if (retries > maxRetries) {
            console.error("All addProject attempts failed");
            throw error;
          }
          const delay = 1000 * retries;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error("Failed to add project:", error);
    } finally {
      updateIsRequesting(false);
    }
  };

  const completeProject = async (id) => {
    let retries = 0;
    const maxRetries = 2;
    const project = projects.find((p) => p.id === id);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    try {
      updateIsRequesting(true);

      // 乐观更新UI
      if (project) {
        setProjects((prevProjects) =>
          prevProjects.map((p) => {
            if (p.id === id) {
              const completionDates = p.completionDates || [];
              if (!completionDates.includes(today)) {
                return { ...p, completionDates: [...completionDates, today] };
              }
            }
            return p;
          })
        );
        setRiceScore((prevScore) => prevScore + (Number(project.points) || 0));
      }

      while (retries <= maxRetries) {
        try {
          const response = await fetchWithTimeout(
            `${API_BASE}/api/data/projects/${id}/complete`,
            {
              method: "POST",
            }
          );

          // The response now contains { message, project, riceScore }
          const updatedProject = response.project;
          const updatedScore = response.riceScore;

          // 用后端返回的数据更新
          if (updatedProject) {
            setProjects((prevProjects) =>
              prevProjects.map((p) => (p.id === id ? updatedProject : p))
            );
          }
          if (typeof updatedScore === 'number') {
            setRiceScore(updatedScore);
          }
          break;
        } catch (error) {
          console.error(
            `Failed to complete project (attempt ${retries + 1}/${maxRetries + 1
            }):`,
            error
          );
          retries++;
          if (retries > maxRetries) {
            console.error("All completeProject attempts failed");
            // 所有重试都失败，回滚乐观更新
            if (project) {
              setProjects((prevProjects) =>
                prevProjects.map((p) =>
                  p.id === id ? project : p
                )
              );
              setRiceScore(
                (prevScore) => prevScore - (Number(project.points) || 0)
              );
            }
            alert("任务完成失败，请重试");
          } else {
            const delay = 1000 * retries;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    } catch (error) {
      console.error("Failed to complete project:", error);
      // 发生错误时回滚乐观更新
      if (project) {
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === id ? project : p
          )
        );
        setRiceScore((prevScore) => prevScore - (Number(project.points) || 0));
      }
    } finally {
      updateIsRequesting(false);
    }
  };

  const buyConsumable = async (consumableId, date) => {
    const consumable = consumables.find((c) => c.id === consumableId);
    if (!consumable) return;

    const originalScore = Number(riceScore) || 0;
    const updatedScore = originalScore - (Number(consumable.cost) || 0);

    // 提前检查余额
    if (updatedScore < 0) {
      alert("米粒不足，无法购买");
      return;
    }

    // 如果没有指定日期，使用今天
    const purchaseDate = date || (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    const optimisticRecord = {
      id: `temp-${Date.now()}`,
      consumableId,
      name: consumable.name,
      cost: consumable.cost,
      purchaseDate: purchaseDate,
    };

    updateIsRequesting(true);

    // 乐观更新：立即扣分并添加记录
    if (updatedScore !== originalScore) {
      setRiceScore(updatedScore);
    }
    setPurchaseRecords((prevRecords) => [optimisticRecord, ...prevRecords]);

    let retries = 0;
    const maxRetries = 2;

    try {
      while (retries <= maxRetries) {
        try {
          const data = await fetchWithTimeout(
            `${API_BASE}/api/data/consumables/${consumableId}/buy`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date: purchaseDate }),
            }
          );

          // 后端同步成功：用真实数据替换临时记录
          setPurchaseRecords((prevRecords) =>
            prevRecords.map((r) =>
              r.id === optimisticRecord.id
                ? {
                  ...data.purchaseRecord,
                  id: data.purchaseRecord.id || optimisticRecord.id,
                }
                : r
            )
          );
          // 如果后端返回了最新的分数且与当前分数不同，则同步
          if (
            typeof data.riceScore === "number" &&
            Number.isFinite(data.riceScore) &&
            data.riceScore !== updatedScore
          ) {
            setRiceScore(data.riceScore);
          }
          break;
        } catch (error) {
          console.error(
            `Failed to buy consumable (attempt ${retries + 1}/${maxRetries + 1
            }):`,
            error
          );
          retries++;
          if (retries > maxRetries) {
            console.error("All buyConsumable attempts failed");
            // 回滚：仅当分数变化时才重置
            if (updatedScore !== originalScore) {
              setRiceScore(originalScore);
            }
            setPurchaseRecords((prevRecords) =>
              prevRecords.filter((r) => r.id !== optimisticRecord.id)
            );
            alert("购买失败，请重试");
          } else {
            const delay = 1000 * retries;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    } catch (error) {
      console.error("Failed to buy consumable:", error);
      // 回滚：仅当分数变化时才重置
      if (updatedScore !== originalScore) {
        setRiceScore(originalScore);
      }
      setPurchaseRecords((prevRecords) =>
        prevRecords.filter((r) => r.id !== optimisticRecord.id)
      );
      alert("购买失败，请重试");
    } finally {
      updateIsRequesting(false);
    }
  };

  const refundConsumable = async (consumableId, date) => {
    const consumable = consumables.find((c) => c.id === consumableId);
    if (!consumable) return;

    const originalScore = Number(riceScore) || 0;
    const updatedScore = originalScore + (Number(consumable.cost) || 0);

    // 找到要删除的购买记录
    const recordToDelete = purchaseRecords.find(
      r => r.consumableId === consumableId && r.purchaseDate === date
    );
    if (!recordToDelete) return;

    updateIsRequesting(true);

    // 乐观更新：立即返还米粒并删除记录
    setRiceScore(updatedScore);
    setPurchaseRecords((prevRecords) => prevRecords.filter(r => r.id !== recordToDelete.id));

    let retries = 0;
    const maxRetries = 2;

    try {
      while (retries <= maxRetries) {
        try {
          const data = await fetchWithTimeout(
            `${API_BASE}/api/data/consumables/${consumableId}/refund`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date }),
            }
          );

          // 如果后端返回了最新的分数且与当前分数不同，则同步
          if (
            typeof data.riceScore === "number" &&
            Number.isFinite(data.riceScore) &&
            data.riceScore !== updatedScore
          ) {
            setRiceScore(data.riceScore);
          }
          break;
        } catch (error) {
          console.error(
            `Failed to refund consumable (attempt ${retries + 1}/${maxRetries + 1}):`,
            error
          );
          retries++;
          if (retries > maxRetries) {
            console.error("All refund attempts failed");
            // 回滚
            setRiceScore(originalScore);
            setPurchaseRecords((prevRecords) => [recordToDelete, ...prevRecords]);
            alert("退还失败，请重试");
          } else {
            const delay = 1000 * retries;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    } catch (error) {
      console.error("Failed to refund consumable:", error);
      // 回滚
      setRiceScore(originalScore);
      setPurchaseRecords((prevRecords) => [recordToDelete, ...prevRecords]);
    } finally {
      updateIsRequesting(false);
    }
  };

  const addConsumable = async (name, cost, icon = '🍱') => {
    let retries = 0;
    const maxRetries = 2;
    let tempConsumable = null;

    try {
      updateIsRequesting(true);

      // 乐观更新：立即添加临时项目
      tempConsumable = {
        id: `temp-${Date.now()}`,
        name,
        cost,
        icon,
        isTemporary: true
      };
      setConsumables(prev => [...prev, tempConsumable]);

      while (retries <= maxRetries) {
        try {
          const newConsumable = await fetchWithTimeout(
            `${API_BASE}/api/data/consumables`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name, cost, icon }),
            }
          );

          // 用真实数据替换临时项目
          setConsumables(prev =>
            prev.map(item =>
              item.id === tempConsumable.id ? newConsumable : item
            )
          );
          return newConsumable;
        } catch (error) {
          console.error(
            `Failed to add consumable (attempt ${retries + 1}/${maxRetries + 1
            }):`,
            error
          );
          retries++;
          if (retries > maxRetries) {
            console.error("All addConsumable attempts failed");
            // 失败：移除临时项目
            setConsumables(prev => prev.filter(item => item.id !== tempConsumable.id));
            return null;
          }
          const delay = 1000 * retries;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error("Failed to add consumable:", error);
      // 异常：移除临时项目
      if (tempConsumable) {
        setConsumables(prev => prev.filter(item => item.id !== tempConsumable.id));
      }
      return null;
    } finally {
      updateIsRequesting(false);
    }
  };

  const updateConsumable = async (id, updatedFields) => {
    try {
      updateIsRequesting(true);
      const response = await fetch(`${API_BASE}/api/data/consumables/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFields),
      });
      const updatedConsumable = await response.json();

      if (response.ok) {
        setConsumables((prev) =>
          prev.map((c) => (c.id === id ? updatedConsumable : c))
        );
        return true;
      } else {
        alert(updatedConsumable.message || "更新失败");
        return false;
      }
    } catch (error) {
      console.error("Failed to update consumable:", error);
      return false;
    } finally {
      updateIsRequesting(false);
    }
  };

  const deleteConsumable = async (id) => {
    try {
      updateIsRequesting(true);

      // 乐观更新：立即从列表中移除
      const originalConsumables = consumables;
      setConsumables(prev => prev.filter(c => c.id !== id));

      const response = await fetch(`${API_BASE}/api/data/consumables/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        return true;
      } else {
        // 后端删除失败，回滚
        setConsumables(originalConsumables);
        const data = await response.json();
        alert(data.message || "删除失败");
        return false;
      }
    } catch (error) {
      console.error("Failed to delete consumable:", error);
      // 网络错误，回滚
      setConsumables(prev => prev.filter(c => c.id !== id).concat(consumables.filter(c => c.id === id)));
      alert("删除过程中出现错误");
      return false;
    } finally {
      updateIsRequesting(false);
    }
  };

  const toggleProjectCompletion = async (id, date) => {
    const originalProjects = projects;
    const originalScore = Number(riceScore) || 0;
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    const isCompleted = project.completionDates.includes(date);
    const points = Number(project.points) || 0;

    updateIsRequesting(true);

    // Optimistic UI update
    const updatedProjects = projects.map((p) => {
      if (p.id === id) {
        const newCompletionDates = isCompleted
          ? p.completionDates.filter((d) => d !== date)
          : [...p.completionDates, date];
        return { ...p, completionDates: newCompletionDates };
      }
      return p;
    });
    const updatedScore = isCompleted
      ? originalScore - points
      : originalScore + points;

    // Only update if actually changed
    if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) {
      setProjects(updatedProjects);
    }
    if (updatedScore !== originalScore) {
      setRiceScore(updatedScore);
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/data/projects/${id}/completions/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ date }),
        }
      );

      if (!response.ok) {
        // Rollback on error only if state changed
        if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) {
          setProjects(originalProjects);
        }
        if (updatedScore !== originalScore) {
          setRiceScore(originalScore);
        }
        throw new Error("Failed to toggle project completion");
      }

      const data = await response.json();
      // Update with server data only if different from optimistic update
      const serverProject = data.project;
      const localProject = updatedProjects.find((p) => p.id === id);

      // 比较完成日期集合（不考虑顺序）
      const areDatesSame = (a, b) => {
        if (a.length !== b.length) return false;
        const setA = new Set(a);
        return b.every((date) => setA.has(date));
      };

      if (
        !areDatesSame(
          serverProject.completionDates,
          localProject.completionDates
        )
      ) {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? serverProject : p))
        );
      }
      if (
        typeof data.riceScore === "number" &&
        Number.isFinite(data.riceScore) &&
        data.riceScore !== updatedScore
      ) {
        setRiceScore(data.riceScore);
      }
    } catch (error) {
      console.error("Failed to toggle project completion:", error);
      alert("操作失败，请重试");
    } finally {
      updateIsRequesting(false);
    }
  };

  const updateProject = async (id, updatedFields) => {
    try {
      updateIsRequesting(true);
      const response = await fetch(`${API_BASE}/api/data/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFields),
      });
      const updatedProject = await response.json();

      if (response.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? updatedProject : p))
        );
      } else {
        alert(updatedProject.message || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      updateIsRequesting(false);
    }
  };

  const deleteProject = async (id, clearPoints = false) => {
    try {
      updateIsRequesting(true);
      const response = await fetch(`${API_BASE}/api/data/projects/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clearPoints }),
      });

      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (clearPoints) {
          const data = await response.json();
          if (typeof data.riceScore === 'number' && Number.isFinite(data.riceScore)) {
            setRiceScore(data.riceScore);
          }
        }
        return true;
      } else {
        const data = await response.json();
        alert(data.message || "删除失败");
        return false;
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("删除过程中出现错误");
      return false;
    } finally {
      updateIsRequesting(false);
    }
  };

  return (
    <RiceContext.Provider
      value={{
        riceScore,
        projects,
        consumables,
        purchaseRecords,
        addRice,
        consumeRice,
        addProject,
        completeProject,
        buyConsumable,
        refundConsumable,
        addConsumable,
        updateConsumable,
        deleteConsumable,
        toggleProjectCompletion,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </RiceContext.Provider>
  );
};

export const useRice = () => useContext(RiceContext);
