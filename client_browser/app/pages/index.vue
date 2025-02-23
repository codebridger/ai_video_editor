<script setup lang="ts">
import { useForm } from "vee-validate";

onMounted(() => {
  useRouter().push("/dashboard");
});
</script>

<template>
  <div>
    <h1>Home</h1>
  </div>
</template>
