<script lang="ts">
  let { children }: { children?: import("svelte").Snippet } = $props();
</script>

<div data-testid="svelte-flow-stub">{@render children?.()}</div>
